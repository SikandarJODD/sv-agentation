import { untrack } from 'svelte';
import { resolveElementInfo } from 'element-source';

import type {
	DragSelectionState,
	GroupSelectionPreviewState,
	InspectorHoverInfo,
	InspectorNote,
	InspectorPosition,
	InspectorRuntimeOptions,
	NoteComposerState,
	NoteSourceInfo,
	NotesSettings,
	RectBox,
	RenderedInspectorNote,
	ToolbarCoordinates,
	ToolbarState,
	VsCodeScheme
} from './types';
import {
	buildDomPath,
	clampNumber,
	isInspectorUiTarget,
	isInteractiveElement,
	isTypingTarget,
	resolveElementFromNode,
	resolveInspectableTarget
} from './utils/dom';
import {
	alignToolbarPositionForStateChange,
	buildSourceInfoFromHoverInfo,
	clampToolbarPosition,
	createEmptySourceInfo,
	DEFAULT_DELETE_ALL_DELAY_MS,
	DEFAULT_NOTES_SETTINGS,
	formatNotesAsMarkdown,
	getPageStorageKey,
	readStoredMarkerColor,
	readStoredNotes,
	readStoredSettings,
	readStoredThemeMode,
	renderNote,
	sanitizeDeleteAllDelayMs,
	writeStoredMarkerColor,
	writeStoredNotes,
	writeStoredSettings,
	writeStoredThemeMode
} from './utils/notes';
import {
	DEFAULT_INSPECTOR_POSITION,
	getNearestInspectorPosition,
	getToolbarAlignment,
	getToolbarCoordinatesForPreset,
	readStoredToolbarPlacement,
	sanitizeInspectorPosition,
	type ToolbarPositionMode,
	writeStoredToolbarPlacement
} from './utils/position';
import {
	serializeTextSelection
} from './utils/selection';
import { buildHoverInfo, getHoverGeometry } from './utils/source';
import type { InspectorBlockedInteractionDetail } from './events';
import {
	buildAnchorFromClick,
	buildAreaComposer,
	buildComposerFromExistingNote,
	buildElementComposer,
	buildGroupComposer,
	buildNoteFromComposer,
	buildTextComposer,
	resolveComposerLayout,
	scrollNoteIntoView,
	updateComposerPosition
} from './internal/controller-composer';
import {
	dispatchBlockedInteraction,
	dispatchInspectorActiveChange,
	installInspectorCursorStyles,
	removeInspectorCursorStyles,
	setDragUserSelectSuppressed
} from './internal/controller-browser';
import {
	buildNextDragSelection,
	findSelectableElementsInRect,
	getActiveTextSelection,
	resolvePendingGroupElements,
	toggleGroupSelectionItems
} from './internal/controller-selection';
import {
	buildSelectionPreview,
	createDeleteAllState,
	createModifierState,
	createToolbarState,
	DRAG_THRESHOLD,
	type DeleteAllState,
	type GroupSelectionItem,
	type ModifierState,
	type MouseDownState,
	type ToolbarDragState,
	type UserSelectSnapshot
} from './internal/controller-state.svelte';

const DEFAULT_OPTIONS: InspectorRuntimeOptions = {
	workspaceRoot: null,
	selector: null,
	vscodeScheme: 'vscode',
	openSourceOnClick: false,
	deleteAllDelayMs: DEFAULT_DELETE_ALL_DELAY_MS,
	toolbarPosition: DEFAULT_INSPECTOR_POSITION
};

export class CopyOpenController {
	enabled = $state(false);
	hoverInfo = $state<InspectorHoverInfo | null>(null);
	copied = $state(false);
	toolbar = $state<ToolbarState>(createToolbarState());
	toolbarPositionPreset = $state<InspectorPosition>(DEFAULT_INSPECTOR_POSITION);
	deleteAllState = $state<DeleteAllState>(createDeleteAllState());
	settings = $state<NotesSettings>(DEFAULT_NOTES_SETTINGS);
	notes = $state<InspectorNote[]>([]);
	renderedNotes = $state<RenderedInspectorNote[]>([]);
	composer = $state<NoteComposerState | null>(null);
	noteDraft = $state('');
	activeNoteId = $state<string | null>(null);
	selectionPreview = $state<GroupSelectionPreviewState | null>(null);
	dragSelection = $state<DragSelectionState | null>(null);

	#lastTarget: Element | null = null;
	#workspaceRoot: string | null = DEFAULT_OPTIONS.workspaceRoot;
	#selector: string | null = DEFAULT_OPTIONS.selector;
	#vscodeScheme: VsCodeScheme = DEFAULT_OPTIONS.vscodeScheme;
	#openSourceOnClick = DEFAULT_OPTIONS.openSourceOnClick;
	#deleteAllDelayMs = DEFAULT_OPTIONS.deleteAllDelayMs;
	#toolbarPositionMode: ToolbarPositionMode = 'preset';
	#toolbarPositionDefault = DEFAULT_OPTIONS.toolbarPosition;
	#copyResetTimer: number | null = null;
	#toolbarCopyResetTimer: number | null = null;
	#deleteAllCommitTimer: number | null = null;
	#deleteAllFrame: number | null = null;
	#deleteAllDeadline = 0;
	#toolbarDrag: ToolbarDragState = { pointerId: null, offsetX: 0, offsetY: 0, width: 0, height: 0 };
	#pageStorageKey = 'unknown-page';
	#groupSelectionItems: GroupSelectionItem[] = [];
	#mouseDownState: MouseDownState | null = null;
	#dragActive = false;
	#lastDragUpdate = 0;
	#suppressNextClick = false;
	#modifierState: ModifierState = createModifierState();
	#cursorStyleElement: HTMLStyleElement | null = null;
	#dragUserSelectSnapshot: UserSelectSnapshot | null = null;

	constructor(options: Partial<InspectorRuntimeOptions> = {}) {
		this.updateOptions(options);
		this.deleteAllState = createDeleteAllState(this.#deleteAllDelayMs);

		if (typeof window !== 'undefined') {
			this.#pageStorageKey = getPageStorageKey();
			const storedSettings = readStoredSettings();
			const themeMode = readStoredThemeMode() ?? DEFAULT_NOTES_SETTINGS.themeMode;
			const markerColor = readStoredMarkerColor() ?? DEFAULT_NOTES_SETTINGS.markerColor;
			const storedToolbarPlacement = readStoredToolbarPlacement();

			writeStoredThemeMode(themeMode);
			writeStoredMarkerColor(markerColor);

			this.settings = {
				...storedSettings,
				themeMode,
				markerColor
			};
			const initialToolbarPlacement =
				storedToolbarPlacement ?? {
					mode: 'preset' as const,
					preset: this.#toolbarPositionDefault,
					coordinates: getToolbarCoordinatesForPreset(this.#toolbarPositionDefault, false)
				};

			this.#toolbarPositionMode = initialToolbarPlacement.mode;
			this.toolbarPositionPreset = initialToolbarPlacement.preset;
			this.#setToolbar({
				position:
					initialToolbarPlacement.mode === 'preset'
						? getToolbarCoordinatesForPreset(initialToolbarPlacement.preset, this.toolbar.expanded)
						: clampToolbarPosition(initialToolbarPlacement.coordinates, this.toolbar.expanded)
			});
			this.#persistToolbarPlacement(this.toolbar.position, {
				mode: initialToolbarPlacement.mode,
				preset: initialToolbarPlacement.preset,
				expanded: this.toolbar.expanded
			});
			this.notes = readStoredNotes(this.#pageStorageKey);
			this.refreshRenderedNotes();
		}
	}

	updateOptions(options: Partial<InspectorRuntimeOptions>) {
		if ('workspaceRoot' in options) {
			this.#workspaceRoot = options.workspaceRoot ?? DEFAULT_OPTIONS.workspaceRoot;
		}

		if ('selector' in options) {
			this.#selector = options.selector ?? DEFAULT_OPTIONS.selector;
		}

		if ('vscodeScheme' in options) {
			this.#vscodeScheme = options.vscodeScheme ?? DEFAULT_OPTIONS.vscodeScheme;
		}

		if ('openSourceOnClick' in options) {
			this.#openSourceOnClick = options.openSourceOnClick ?? DEFAULT_OPTIONS.openSourceOnClick;
		}

		if ('deleteAllDelayMs' in options) {
			const nextDeleteAllDelayMs = sanitizeDeleteAllDelayMs(options.deleteAllDelayMs);
			const currentDeleteAllState = untrack(() => this.deleteAllState);

			if (nextDeleteAllDelayMs !== this.#deleteAllDelayMs) {
				this.#deleteAllDelayMs = nextDeleteAllDelayMs;
			}

			if (
				nextDeleteAllDelayMs !== currentDeleteAllState.durationMs &&
				!currentDeleteAllState.active
			) {
				this.deleteAllState = createDeleteAllState(this.#deleteAllDelayMs);
			}
		}

		if ('toolbarPosition' in options) {
			this.#toolbarPositionDefault = sanitizeInspectorPosition(options.toolbarPosition);
		}
	}

	toggle = () => {
		this.enabled = !this.enabled;
		this.#setToolbar({
			confirmDeleteAll: false
		});

		if (this.enabled) {
			this.#cursorStyleElement = installInspectorCursorStyles(this.#cursorStyleElement);
		} else {
			this.closeComposer();
			this.clearHover();
			this.#clearTransientSelections();
			this.#cursorStyleElement = removeInspectorCursorStyles(this.#cursorStyleElement);
		}

		dispatchInspectorActiveChange(this.enabled);
	};

	toggleToolbar = () => {
		const expanded = !this.toolbar.expanded;
		if (!expanded) {
			this.cancelDeleteAll();
		}
		const nextPosition = alignToolbarPositionForStateChange(
			this.toolbar.position,
			this.toolbar.expanded,
			expanded,
			getToolbarAlignment(this.toolbarPositionPreset)
		);

		this.#setToolbar({
			expanded,
			settingsOpen: expanded ? this.toolbar.settingsOpen : false,
			confirmDeleteAll: false,
			position: nextPosition
		});
		this.#persistToolbarPlacement(nextPosition, { expanded });
	};

	closeToolbar = () => {
		this.cancelDeleteAll();
		const nextPosition = alignToolbarPositionForStateChange(
			this.toolbar.position,
			true,
			false,
			getToolbarAlignment(this.toolbarPositionPreset)
		);

		this.#setToolbar({
			expanded: false,
			settingsOpen: false,
			confirmDeleteAll: false,
			position: nextPosition
		});
		this.#persistToolbarPlacement(nextPosition, { expanded: false });
	};

	toggleSettings = () => {
		const expanded = true;
		const settingsOpen = !this.toolbar.settingsOpen;
		const nextPosition = clampToolbarPosition(this.toolbar.position, expanded);
		this.#setToolbar({
			expanded,
			settingsOpen,
			confirmDeleteAll: false,
			position: nextPosition
		});
		this.#persistToolbarPlacement(nextPosition, { expanded });
	};

	setToolbarPosition = (toolbarPosition: InspectorPosition) => {
		const nextPosition = getToolbarCoordinatesForPreset(toolbarPosition, this.toolbar.expanded);
		this.#toolbarPositionMode = 'preset';
		this.toolbarPositionPreset = toolbarPosition;
		this.#setToolbar({
			position: nextPosition
		});
		this.#persistToolbarPlacement(nextPosition, {
			mode: 'preset',
			preset: toolbarPosition,
			expanded: this.toolbar.expanded
		});
	};

	resetToolbarPosition = () => {
		this.setToolbarPosition(DEFAULT_INSPECTOR_POSITION);
	};

	requestDeleteAll = () => {
		if (this.notes.length === 0) return;
		if (this.deleteAllState.active) {
			this.cancelDeleteAll();
			return;
		}

		this.#startDeleteAll();
	};

	cancelDeleteAll = () => {
		this.#clearDeleteAllTimers();
		this.deleteAllState = createDeleteAllState(this.#deleteAllDelayMs);
		this.#setToolbar({ confirmDeleteAll: false });
	};

	confirmDeleteAll = () => {
		this.#clearDeleteAllTimers();
		this.deleteAllState = createDeleteAllState(this.#deleteAllDelayMs);
		this.notes = [];
		this.renderedNotes = [];
		this.activeNoteId = null;
		this.closeComposer();
		this.#clearTransientSelections();
		this.#persistNotes();
		this.#setToolbar({
			confirmDeleteAll: false
		});
	};

	toggleNotesVisibility = () => {
		this.#setToolbar({ notesVisible: !this.toolbar.notesVisible });
	};

	setMarkerColor = (color: string) => {
		this.settings = {
			...this.settings,
			markerColor: color
		};
		writeStoredMarkerColor(color);
	};

	setBlockPageInteractions = (value: boolean) => {
		this.settings = {
			...this.settings,
			blockPageInteractions: value
		};
		writeStoredSettings(this.settings);
	};

	toggleThemeMode = () => {
		const themeMode = this.settings.themeMode === 'dark' ? 'light' : 'dark';
		this.settings = {
			...this.settings,
			themeMode
		};
		writeStoredThemeMode(themeMode);
	};

	handleToolbarPointerDown = (event: PointerEvent) => {
		if (event.button !== 0) return;

		let width = 0;
		let height = 0;
		const currentTarget = event.currentTarget;
		if (currentTarget instanceof HTMLElement) {
			const rect = currentTarget.getBoundingClientRect();
			width = rect.width;
			height = rect.height;
		}

		this.#toolbarDrag = {
			pointerId: event.pointerId,
			offsetX: event.clientX - this.toolbar.position.x,
			offsetY: event.clientY - this.toolbar.position.y,
			width,
			height
		};
		this.#setToolbar({ dragging: true });
		event.preventDefault();
	};

	handleMouseDownCapture = (event: MouseEvent) => {
		if (event.button !== 0) return;
		if (!this.enabled) return;
		if (this.composer) return;

		const target = resolveElementFromNode(event.target as Node | null);
		if (!target || isInspectorUiTarget(target)) return;
		if ((event.metaKey || event.ctrlKey) && event.shiftKey) return;

		this.#mouseDownState = {
			x: event.clientX,
			y: event.clientY,
			target
		};
		this.#dragActive = false;
		this.dragSelection = null;
	};

	handlePointerMove = async (event: PointerEvent) => {
		if (this.toolbar.dragging) {
			if (this.#toolbarDrag.pointerId !== event.pointerId) return;

			const nextPosition: ToolbarCoordinates = {
				x: event.clientX - this.#toolbarDrag.offsetX,
				y: event.clientY - this.#toolbarDrag.offsetY
			};

			this.#setToolbar({
				position: clampToolbarPosition(nextPosition, this.toolbar.expanded, {
					width: this.#toolbarDrag.width,
					height: this.#toolbarDrag.height
				})
			});
			return;
		}

		if (
			this.enabled &&
			this.#mouseDownState &&
			(event.buttons & 1) === 1 &&
			!this.composer &&
			!this.#isGroupingModifiersHeld()
		) {
			this.#updateDragSelection(event);
			if (this.#dragActive) {
				this.clearHover();
				return;
			}
		}

		if (!this.enabled || this.composer || this.#dragActive) return;

		const target = resolveInspectableTarget(event.target, this.#selector);
		if (!target) {
			this.clearHover();
			return;
		}

		if (target === this.#lastTarget && this.hoverInfo !== null) {
			this.hoverInfo = {
				...this.hoverInfo,
				...getHoverGeometry(target, event.clientX, event.clientY)
			};
			return;
		}

		this.#lastTarget = target;

		const hoverInfo = await this.#resolveHoverInfo(target, event.clientX, event.clientY);
		if (this.#lastTarget !== target || !this.enabled || this.composer || this.#dragActive) return;

		this.copied = false;
		this.#clearCopyResetTimer();
		this.hoverInfo = hoverInfo;
	};

	handlePointerUp = (event: PointerEvent) => {
		if (!this.toolbar.dragging) return;
		if (this.#toolbarDrag.pointerId !== null && event.pointerId !== this.#toolbarDrag.pointerId)
			return;

		const nextPosition = this.toolbar.position;
		this.#toolbarDrag = { pointerId: null, offsetX: 0, offsetY: 0, width: 0, height: 0 };
		this.#setToolbar({ dragging: false });
		this.#persistToolbarPlacement(nextPosition, {
			mode: 'custom',
			expanded: this.toolbar.expanded
		});
	};

	handleMouseUpCapture = async (event: MouseEvent) => {
		if (event.button !== 0) return;

		const dragSelection = this.dragSelection;
		const hadDrag = this.#dragActive;

		this.#mouseDownState = null;
		this.#dragActive = false;
		this.dragSelection = null;
		this.#lastDragUpdate = 0;
		this.#dragUserSelectSnapshot = setDragUserSelectSuppressed(
			false,
			this.#dragUserSelectSnapshot
		);

		if (!this.enabled || this.composer) return;

		const target = resolveElementFromNode(event.target as Node | null);
		if (target && isInspectorUiTarget(target)) return;

		if (hadDrag && dragSelection) {
			await this.#finalizeDragSelection(dragSelection);
			this.#suppressNextClick = true;
			return;
		}

		const activeSelection = this.#getActiveTextSelection();
		if (activeSelection) {
			if (target && this.settings.blockPageInteractions && isInteractiveElement(target)) {
				this.#blockInteraction(event, target, 'selection');
			}

			await this.#openTextComposerFromSelection(activeSelection);
			this.#suppressNextClick = true;
		}
	};

	handleViewportChange = () => {
		if (!this.composer) {
			this.clearHover();
		}

		const nextPosition = clampToolbarPosition(this.toolbar.position, this.toolbar.expanded);
		const positionChanged =
			nextPosition.x !== this.toolbar.position.x || nextPosition.y !== this.toolbar.position.y;

		this.#setToolbar({
			position: nextPosition
		});
		if (positionChanged) {
			this.#persistToolbarPlacement(nextPosition, {
				expanded: this.toolbar.expanded
			});
		}
		this.refreshRenderedNotes();
		this.#refreshComposerLayout();
		this.#refreshSelectionPreview();
	};

	handleClick = async (event: MouseEvent) => {
		if (event.defaultPrevented) return;
		if (event.button !== 0) return;
		if (!this.enabled) return;

		if (this.#suppressNextClick) {
			this.#suppressNextClick = false;
			return;
		}

		const target = resolveInspectableTarget(event.target, this.#selector);
		if (!target) return;

		if (this.composer) {
			if (this.settings.blockPageInteractions && isInteractiveElement(target)) {
				this.#blockInteraction(event, target, 'click');
			}
			return;
		}

		if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
			this.#toggleGroupSelectionTarget(target);
			return;
		}

		const selection = window.getSelection();
		if (selection && !selection.isCollapsed && selection.toString().trim()) return;

		if (this.settings.blockPageInteractions && isInteractiveElement(target)) {
			this.#blockInteraction(event, target, 'click');
		}

		await this.#openElementComposer(target, event.clientX, event.clientY, null, '');
	};

	handleKeyDown = async (event: KeyboardEvent) => {
		if (event.defaultPrevented) return;

		const key = event.key.toLowerCase();
		if (key === 'meta' || key === 'control') {
			this.#modifierState.metaOrCtrl = true;
			return;
		}
		if (key === 'shift') {
			this.#modifierState.shift = true;
			return;
		}

		if (key === 'escape') {
			if (this.#groupSelectionItems.length > 0 || this.dragSelection) {
				event.preventDefault();
				this.#clearTransientSelections();
				return;
			}

			if (this.composer) {
				event.preventDefault();
				this.closeComposer();
				return;
			}

			if (this.toolbar.settingsOpen || this.toolbar.confirmDeleteAll) {
				event.preventDefault();
				this.#setToolbar({
					settingsOpen: false,
					confirmDeleteAll: false
				});
			}
			return;
		}

		if (event.metaKey || event.ctrlKey || event.altKey) return;
		if (isTypingTarget(event.target)) return;

		if (key === 'i') {
			event.preventDefault();
			this.toggle();
			return;
		}

		if (key === 'c') {
			if (this.notes.length === 0) return;
			event.preventDefault();
			await this.copyNotes();
			return;
		}

		if (key === 'r') {
			event.preventDefault();
			this.resetToolbarPosition();
			return;
		}

		if (!this.enabled || this.composer) return;

		if (key === 'o') {
			event.preventDefault();
			this.open();
		}
	};

	handleKeyUp = async (event: KeyboardEvent) => {
		const key = event.key.toLowerCase();
		if (key === 'meta' || key === 'control') {
			this.#modifierState.metaOrCtrl = false;
		}
		if (key === 'shift') {
			this.#modifierState.shift = false;
		}

		if (this.#groupSelectionItems.length > 0 && !this.#isGroupingModifiersHeld()) {
			await this.#openPendingGroupComposer();
		}
	};

	handleWindowBlur = () => {
		this.#modifierState = createModifierState();
		this.#clearTransientSelections();
	};

	copy = async () => {
		if (!this.hoverInfo?.canCopy) return false;

		try {
			await navigator.clipboard.writeText(this.hoverInfo.copyText);
			this.copied = true;
			this.#scheduleCopyReset();
			return true;
		} catch {
			return false;
		}
	};

	copyNotes = async () => {
		if (this.notes.length === 0) return false;

		try {
			await navigator.clipboard.writeText(formatNotesAsMarkdown(this.notes));
			this.#setToolbar({ copyFeedback: true });
			this.#scheduleToolbarCopyReset();
			return true;
		} catch {
			return false;
		}
	};

	open = (hoverInfo: InspectorHoverInfo | null = this.hoverInfo) => {
		if (!hoverInfo?.canOpen || !hoverInfo.vscodeUrl) return false;

		window.location.href = hoverInfo.vscodeUrl;
		return true;
	};

	updateNoteDraft = (value: string) => {
		this.noteDraft = value;
	};

	closeComposer = () => {
		this.composer = null;
		this.noteDraft = '';
		this.clearHover();
		window.getSelection()?.removeAllRanges();
	};

	saveComposer = () => {
		if (!this.composer) return false;

		const noteText = this.noteDraft.trim();
		if (!noteText) return false;
		const existingNote = this.composer.noteId
			? (this.notes.find((note) => note.id === this.composer?.noteId) ?? null)
			: null;
		const nextNote = buildNoteFromComposer({
			composer: this.composer,
			noteText,
			existingNote,
			createNoteId: () => this.#createNoteId()
		});

		this.notes = existingNote
			? this.notes.map((note) => (note.id === nextNote.id ? nextNote : note))
			: [...this.notes, nextNote];

		this.activeNoteId = nextNote.id;
		this.closeComposer();
		this.#clearTransientSelections();
		this.#persistNotes();
		this.refreshRenderedNotes();
		return true;
	};

	openNote = async (noteId: string) => {
		const note = this.notes.find((entry) => entry.id === noteId);
		if (!note) return false;

		this.activeNoteId = note.id;
		await scrollNoteIntoView(note);
		this.#setComposerFromExistingNote(note);
		return true;
	};

	deleteNote = (noteId: string) => {
		this.notes = this.notes.filter((note) => note.id !== noteId);
		this.renderedNotes = this.renderedNotes.filter((note) => note.id !== noteId);

		if (this.composer?.noteId === noteId) {
			this.closeComposer();
		}

		if (this.activeNoteId === noteId) {
			this.activeNoteId = null;
		}

		if (this.notes.length === 0) {
			this.cancelDeleteAll();
		}

		this.#persistNotes();
	};

	refreshRenderedNotes = () => {
		this.renderedNotes = this.notes.map(renderNote);
	};

	destroy() {
		this.cancelDeleteAll();
		this.#clearCopyResetTimer();
		this.#clearToolbarCopyResetTimer();
		this.#dragUserSelectSnapshot = setDragUserSelectSuppressed(
			false,
			this.#dragUserSelectSnapshot
		);
		this.#cursorStyleElement = removeInspectorCursorStyles(this.#cursorStyleElement);
	}

	#setToolbar(patch: Partial<ToolbarState>) {
		this.toolbar = {
			...this.toolbar,
			...patch
		};
	}

	#persistNotes() {
		if (typeof window === 'undefined') return;
		writeStoredNotes(this.#pageStorageKey, this.notes);
	}

	#persistToolbarPlacement(
		position: ToolbarCoordinates = this.toolbar.position,
		options?: {
			mode?: ToolbarPositionMode;
			preset?: InspectorPosition;
			expanded?: boolean;
		}
	) {
		if (typeof window === 'undefined') return;

		const expanded = options?.expanded ?? this.toolbar.expanded;
		const nextMode = options?.mode ?? this.#toolbarPositionMode;
		const nextPreset =
			options?.preset ??
			(nextMode === 'preset'
				? this.toolbarPositionPreset
				: getNearestInspectorPosition(position, expanded));
		const storedCoordinates = expanded
			? alignToolbarPositionForStateChange(position, true, false, getToolbarAlignment(nextPreset))
			: position;

		this.#toolbarPositionMode = nextMode;
		this.toolbarPositionPreset = nextPreset;
		writeStoredToolbarPlacement({
			mode: nextMode,
			preset: nextPreset,
			coordinates: storedCoordinates
		});
	}

	#startDeleteAll() {
		if (typeof window === 'undefined') return;

		this.#clearDeleteAllTimers();
		const durationMs = this.#deleteAllDelayMs;
		this.#deleteAllDeadline = Date.now() + durationMs;
		this.deleteAllState = {
			active: true,
			durationMs,
			remainingMs: durationMs,
			progress: 0
		};
		this.#deleteAllCommitTimer = window.setTimeout(() => {
			this.#deleteAllCommitTimer = null;
			this.confirmDeleteAll();
		}, durationMs);
		this.#syncDeleteAllProgress();
	}

	#syncDeleteAllProgress = () => {
		if (typeof window === 'undefined' || !this.deleteAllState.active) return;

		const remainingMs = Math.max(0, this.#deleteAllDeadline - Date.now());
		const progress =
			this.deleteAllState.durationMs <= 0 ? 1 : 1 - remainingMs / this.deleteAllState.durationMs;

		this.deleteAllState = {
			...this.deleteAllState,
			remainingMs,
			progress
		};

		if (remainingMs <= 0) {
			this.#deleteAllFrame = null;
			return;
		}

		this.#deleteAllFrame = window.requestAnimationFrame(this.#syncDeleteAllProgress);
	};

	#clearDeleteAllTimers() {
		if (typeof window !== 'undefined' && this.#deleteAllFrame !== null) {
			window.cancelAnimationFrame(this.#deleteAllFrame);
		}
		if (this.#deleteAllCommitTimer !== null) {
			clearTimeout(this.#deleteAllCommitTimer);
		}

		this.#deleteAllFrame = null;
		this.#deleteAllCommitTimer = null;
		this.#deleteAllDeadline = 0;
	}

	#isGroupingModifiersHeld() {
		return this.#modifierState.metaOrCtrl && this.#modifierState.shift;
	}

	#clearTransientSelections() {
		this.#groupSelectionItems = [];
		this.selectionPreview = null;
		this.dragSelection = null;
		this.#mouseDownState = null;
		this.#dragActive = false;
		this.#lastDragUpdate = 0;
		this.#suppressNextClick = false;
		this.#dragUserSelectSnapshot = setDragUserSelectSuppressed(
			false,
			this.#dragUserSelectSnapshot
		);
		window.getSelection()?.removeAllRanges();
	}

	#blockInteraction(
		event: MouseEvent,
		target: Element,
		source: InspectorBlockedInteractionDetail['source']
	) {
		dispatchBlockedInteraction(target, source);
		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation();
	}

	#refreshSelectionPreview() {
		this.selectionPreview = buildSelectionPreview(this.#groupSelectionItems);
	}

	#toggleGroupSelectionTarget(target: Element) {
		this.#groupSelectionItems = toggleGroupSelectionItems(this.#groupSelectionItems, target);
		this.#refreshSelectionPreview();
		this.clearHover();
	}

	async #openPendingGroupComposer() {
		const elements = resolvePendingGroupElements(this.#groupSelectionItems);

		this.#groupSelectionItems = [];
		this.selectionPreview = null;

		if (elements.length === 0) return;

		if (elements.length === 1) {
			const target = elements[0];
			const rect = target.getBoundingClientRect();
			await this.#openElementComposer(
				target,
				rect.left + rect.width / 2,
				rect.top + rect.height / 2,
				null,
				''
			);
			return;
		}

		await this.#openGroupComposer(elements, elements[elements.length - 1]);
	}

	#updateDragSelection(event: PointerEvent) {
		if (!this.#mouseDownState) return;

		const nextDragSelection = buildNextDragSelection({
			mouseDownState: this.#mouseDownState,
			event,
			previousSelection: this.dragSelection,
			dragActive: this.#dragActive,
			lastDragUpdate: this.#lastDragUpdate,
			selector: this.#selector
		});
		if (!nextDragSelection) return;

		if (!this.#dragActive) {
			this.#dragActive = true;
			this.#dragUserSelectSnapshot = setDragUserSelectSuppressed(
				true,
				this.#dragUserSelectSnapshot
			);
			window.getSelection()?.removeAllRanges();
		}

		this.dragSelection = nextDragSelection.dragSelection;
		this.#lastDragUpdate = nextDragSelection.lastDragUpdate;
	}

	async #finalizeDragSelection(selection: DragSelectionState) {
		if (selection.width < DRAG_THRESHOLD || selection.height < DRAG_THRESHOLD) return;

		const elements = this.#findSelectableElementsInRect(selection);
		if (elements.length > 0) {
			await this.#openGroupComposer(elements, elements[elements.length - 1]);
			return;
		}

		this.composer = buildAreaComposer({
			selection,
			markerColor: this.settings.markerColor
		});
		this.noteDraft = '';
		this.clearHover();
	}

	#findSelectableElementsInRect(selection: RectBox) {
		return findSelectableElementsInRect(selection, this.#selector);
	}

	#getActiveTextSelection() {
		return getActiveTextSelection(this.#selector);
	}

	async #openElementComposer(
		target: Element,
		clientX: number,
		clientY: number,
		noteId: string | null,
		initialValue: string
	) {
		const anchor = buildAnchorFromClick(target, clientX, clientY, buildDomPath);
		if (!anchor) return false;

		const hoverInfo =
			target === this.#lastTarget && this.hoverInfo !== null
				? this.hoverInfo
				: await this.#resolveHoverInfo(target, clientX, clientY);

		this.#lastTarget = target;
		this.hoverInfo = hoverInfo;
		this.activeNoteId = noteId;
		this.noteDraft = initialValue;
		this.composer = buildElementComposer({
			target,
			noteId,
			initialValue,
			hoverInfo,
			markerColor: this.settings.markerColor,
			anchor
		});
		return true;
	}

	async #openTextComposerFromSelection(selection: ReturnType<typeof serializeTextSelection>) {
		if (!selection) return false;

		const sourceInfo = await this.#resolveSourceInfo(
			selection.commonAncestor,
			selection.markerLeft,
			selection.markerTop
		);
		this.activeNoteId = null;
		this.noteDraft = '';
		this.composer = buildTextComposer({
			selection,
			sourceInfo,
			markerColor: this.settings.markerColor
		});
		window.getSelection()?.removeAllRanges();
		this.clearHover();
		return true;
	}

	async #openGroupComposer(elements: Element[], anchorElement: Element) {
		const anchorRect = anchorElement.getBoundingClientRect();
		const sourceInfo = await this.#resolveSourceInfo(
			anchorElement,
			anchorRect.left + anchorRect.width / 2,
			anchorRect.top + anchorRect.height / 2
		);

		this.activeNoteId = null;
		this.noteDraft = '';
		this.composer =
			buildGroupComposer({
				elements,
				anchorElement,
				sourceInfo,
				markerColor: this.settings.markerColor
			}) ?? null;
		if (!this.composer) return false;
		this.clearHover();
		return true;
	}

	#setComposerFromExistingNote(note: InspectorNote) {
		this.noteDraft = note.note;
		this.composer = buildComposerFromExistingNote({
			note,
			markerColor: this.settings.markerColor
		});
	}

	#refreshComposerLayout() {
		if (!this.composer) return;
		this.composer = updateComposerPosition(
			this.composer,
			resolveComposerLayout(this.composer)
		);
	}

	#updateComposerPosition(
		markerLeft: number,
		markerTop: number,
		outlineRects: RectBox[],
		highlightRects: RectBox[]
	) {
		if (!this.composer) return;

		this.composer = updateComposerPosition(this.composer, {
			markerLeft,
			markerTop,
			outlineRects,
			highlightRects
		});
	}

	async #resolveSourceInfo(
		target: Element,
		clientX: number,
		clientY: number
	): Promise<NoteSourceInfo> {
		try {
			const hoverInfo = await this.#resolveHoverInfo(target, clientX, clientY);
			return buildSourceInfoFromHoverInfo(hoverInfo);
		} catch {
			return createEmptySourceInfo(target.tagName.toLowerCase());
		}
	}

	async #resolveHoverInfo(target: Element, clientX: number, clientY: number) {
		const elementInfo = await resolveElementInfo(target);

		return buildHoverInfo(target, elementInfo, clientX, clientY, {
			workspaceRoot: this.#workspaceRoot,
			vscodeScheme: this.#vscodeScheme
		});
	}

	clearHover = () => {
		this.#lastTarget = null;
		this.hoverInfo = null;
		this.copied = false;
		this.#clearCopyResetTimer();
	};

	#createNoteId() {
		if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
			return crypto.randomUUID();
		}

		return `note-${Date.now()}`;
	}

	#scheduleCopyReset() {
		this.#clearCopyResetTimer();
		this.#copyResetTimer = window.setTimeout(() => {
			this.copied = false;
			this.#copyResetTimer = null;
		}, 1000);
	}

	#scheduleToolbarCopyReset() {
		this.#clearToolbarCopyResetTimer();
		this.#toolbarCopyResetTimer = window.setTimeout(() => {
			this.#setToolbar({ copyFeedback: false });
			this.#toolbarCopyResetTimer = null;
		}, 1200);
	}

	#clearCopyResetTimer() {
		if (this.#copyResetTimer === null) return;
		window.clearTimeout(this.#copyResetTimer);
		this.#copyResetTimer = null;
	}

	#clearToolbarCopyResetTimer() {
		if (this.#toolbarCopyResetTimer === null) return;
		window.clearTimeout(this.#toolbarCopyResetTimer);
		this.#toolbarCopyResetTimer = null;
	}
}
