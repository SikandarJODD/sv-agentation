import { untrack } from 'svelte';
import { resolveElementInfo } from 'element-source';

import type {
	AreaSelectionAnchor,
	DragSelectionState,
	ElementNoteAnchor,
	GroupSelectionAnchor,
	GroupSelectionPreviewState,
	InspectorHoverInfo,
	InspectorNote,
	InspectorRuntimeOptions,
	NoteComposerState,
	NoteSourceInfo,
	NotesSettings,
	RectBox,
	RenderedInspectorNote,
	TextSelectionAnchor,
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
	matchesSelectorScope,
	resolveDomPath,
	resolveElementFromNode,
	resolveInspectableTarget
} from './utils/dom';
import {
	alignToolbarPositionForStateChange,
	buildAreaComposerVisuals,
	buildAreaTargetLabel,
	buildAreaTargetSummary,
	buildComposerState,
	buildElementTargetLabel,
	buildElementTargetSummary,
	buildGroupSelectionFromRects,
	buildGroupTargetLabel,
	buildGroupTargetSummary,
	buildSourceInfoFromHoverInfo,
	buildTextTargetLabel,
	buildTextTargetSummary,
	clampToolbarPosition,
	createAreaAnchorFromBounds,
	createDefaultToolbarPosition,
	createEmptySourceInfo,
	createGroupAnchorFromElements,
	DEFAULT_DELETE_ALL_DELAY_MS,
	DEFAULT_NOTES_SETTINGS,
	formatNotesAsMarkdown,
	getComposerPlaceholder,
	getPageStorageKey,
	GROUP_SELECTION_COLOR,
	readStoredMarkerColor,
	readStoredNotes,
	readStoredSettings,
	readStoredToolbarPosition,
	readStoredThemeMode,
	renderNote,
	sanitizeDeleteAllDelayMs,
	writeStoredMarkerColor,
	writeStoredNotes,
	writeStoredSettings,
	writeStoredToolbarPosition,
	writeStoredThemeMode
} from './utils/notes';
import {
	markerFromFallback,
	resolveAreaSelection,
	resolveGroupSelection,
	resolveTextSelection,
	serializeTextSelection
} from './utils/selection';
import { buildHoverInfo, getHoverGeometry } from './utils/source';

const DEFAULT_OPTIONS: InspectorRuntimeOptions = {
	workspaceRoot: null,
	selector: null,
	vscodeScheme: 'vscode',
	openSourceOnClick: false,
	deleteAllDelayMs: DEFAULT_DELETE_ALL_DELAY_MS
};

const DRAG_THRESHOLD = 8;
const DRAG_UPDATE_THROTTLE = 32;
const DRAG_CANDIDATE_SELECTOR =
	'button, a, input, img, p, h1, h2, h3, h4, h5, h6, li, label, td, th, div, span, section, article, aside, nav';

type ToolbarDragState = {
	pointerId: number | null;
	offsetX: number;
	offsetY: number;
	width: number;
	height: number;
};

type MouseDownState = {
	x: number;
	y: number;
	target: Element | null;
};

type GroupSelectionItem = {
	element: Element;
	domPath: string;
};

type UserSelectSnapshot = {
	bodyUserSelect: string;
	bodyWebkitUserSelect: string;
	documentUserSelect: string;
	documentWebkitUserSelect: string;
};

type DeleteAllState = {
	active: boolean;
	durationMs: number;
	remainingMs: number;
	progress: number;
};

const createToolbarState = (): ToolbarState => ({
	expanded: false,
	dragging: false,
	settingsOpen: false,
	confirmDeleteAll: false,
	notesVisible: true,
	copyFeedback: false,
	position: createDefaultToolbarPosition()
});

const createDeleteAllState = (durationMs = DEFAULT_DELETE_ALL_DELAY_MS): DeleteAllState => ({
	active: false,
	durationMs,
	remainingMs: durationMs,
	progress: 0
});

const buildAnchorFromClick = (
	target: Element,
	clientX: number,
	clientY: number
): ElementNoteAnchor | null => {
	const domPath = buildDomPath(target);
	if (domPath === null) return null;

	const rect = target.getBoundingClientRect();
	const relativeX = rect.width > 0 ? clampNumber((clientX - rect.left) / rect.width, 0, 1) : 0.5;
	const relativeY = rect.height > 0 ? clampNumber((clientY - rect.top) / rect.height, 0, 1) : 0.5;

	return {
		domPath,
		relativeX,
		relativeY,
		viewportX: clientX,
		viewportY: clientY
	};
};

export class CopyOpenController {
	enabled = $state(false);
	hoverInfo = $state<InspectorHoverInfo | null>(null);
	copied = $state(false);
	toolbar = $state<ToolbarState>(createToolbarState());
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
	#copyResetTimer: ReturnType<typeof setTimeout> | null = null;
	#toolbarCopyResetTimer: ReturnType<typeof setTimeout> | null = null;
	#deleteAllCommitTimer: ReturnType<typeof setTimeout> | null = null;
	#deleteAllFrame: number | null = null;
	#deleteAllDeadline = 0;
	#toolbarDrag: ToolbarDragState = { pointerId: null, offsetX: 0, offsetY: 0, width: 0, height: 0 };
	#pageStorageKey = 'unknown-page';
	#groupSelectionItems: GroupSelectionItem[] = [];
	#mouseDownState: MouseDownState | null = null;
	#dragActive = false;
	#lastDragUpdate = 0;
	#suppressNextClick = false;
	#modifierState = {
		shift: false,
		metaOrCtrl: false
	};
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
			const storedToolbarPosition = readStoredToolbarPosition(this.#pageStorageKey);

			writeStoredThemeMode(themeMode);
			writeStoredMarkerColor(markerColor);

			this.settings = {
				...storedSettings,
				themeMode,
				markerColor
			};
			this.#setToolbar({
				position: clampToolbarPosition(
					storedToolbarPosition ?? createDefaultToolbarPosition(),
					this.toolbar.expanded
				)
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
	}

	toggle = () => {
		this.enabled = !this.enabled;
		this.#setToolbar({
			confirmDeleteAll: false
		});

		if (this.enabled) {
			this.#installCursorStyles();
			return;
		}

		this.closeComposer();
		this.clearHover();
		this.#clearTransientSelections();
		this.#removeCursorStyles();
	};

	toggleToolbar = () => {
		const expanded = !this.toolbar.expanded;
		if (!expanded) {
			this.cancelDeleteAll();
		}
		const nextPosition = alignToolbarPositionForStateChange(
			this.toolbar.position,
			this.toolbar.expanded,
			expanded
		);

		this.#setToolbar({
			expanded,
			settingsOpen: expanded ? this.toolbar.settingsOpen : false,
			confirmDeleteAll: false,
			position: nextPosition
		});
		this.#persistToolbarPosition(nextPosition);
	};

	closeToolbar = () => {
		this.cancelDeleteAll();
		const nextPosition = alignToolbarPositionForStateChange(this.toolbar.position, true, false);

		this.#setToolbar({
			expanded: false,
			settingsOpen: false,
			confirmDeleteAll: false,
			position: nextPosition
		});
		this.#persistToolbarPosition(nextPosition);
	};

	toggleSettings = () => {
		const expanded = true;
		const settingsOpen = !this.toolbar.settingsOpen;
		this.#setToolbar({
			expanded,
			settingsOpen,
			confirmDeleteAll: false,
			position: clampToolbarPosition(this.toolbar.position, expanded)
		});
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
		this.#persistToolbarPosition(nextPosition);
	};

	handleMouseUpCapture = async (event: MouseEvent) => {
		if (event.button !== 0) return;

		const dragSelection = this.dragSelection;
		const hadDrag = this.#dragActive;

		this.#mouseDownState = null;
		this.#dragActive = false;
		this.dragSelection = null;
		this.#lastDragUpdate = 0;
		this.#setDragUserSelectSuppressed(false);

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
				event.preventDefault();
				event.stopPropagation();
				event.stopImmediatePropagation();
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
			this.#persistToolbarPosition(nextPosition);
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
				event.preventDefault();
				event.stopPropagation();
				event.stopImmediatePropagation();
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
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
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
		this.#modifierState = {
			shift: false,
			metaOrCtrl: false
		};
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

		const now = new Date().toISOString();
		const existingNote = this.composer.noteId
			? (this.notes.find((note) => note.id === this.composer?.noteId) ?? null)
			: null;

		const nextNote: InspectorNote = {
			id: existingNote?.id ?? this.#createNoteId(),
			kind: this.composer.noteKind,
			note: noteText,
			targetSummary: this.composer.targetSummary,
			targetLabel: this.composer.targetLabel,
			componentName: this.composer.componentName,
			tagName: this.composer.tagName,
			filePath: this.composer.filePath,
			shortFileName: this.composer.shortFileName,
			lineNumber: this.composer.lineNumber,
			columnNumber: this.composer.columnNumber,
			createdAt: existingNote?.createdAt ?? now,
			updatedAt: now,
			anchor: this.composer.anchor
		} as InspectorNote;

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
		await this.#scrollNoteIntoView(note);
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
		this.#setDragUserSelectSuppressed(false);
		this.#removeCursorStyles();
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

	#persistToolbarPosition(position: ToolbarCoordinates = this.toolbar.position) {
		if (typeof window === 'undefined') return;
		writeStoredToolbarPosition(this.#pageStorageKey, position);
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
		this.#setDragUserSelectSuppressed(false);
		window.getSelection()?.removeAllRanges();
	}

	#refreshSelectionPreview() {
		if (this.#groupSelectionItems.length === 0) {
			this.selectionPreview = null;
			return;
		}

		const rects = this.#groupSelectionItems
			.filter((item) => document.contains(item.element))
			.map((item) => item.element.getBoundingClientRect())
			.map((rect) => ({
				left: rect.left,
				top: rect.top,
				width: rect.width,
				height: rect.height
			}));

		this.selectionPreview = rects.length > 0 ? { rects } : null;
	}

	#toggleGroupSelectionTarget(target: Element) {
		const domPath = buildDomPath(target);
		if (!domPath) return;

		const existingIndex = this.#groupSelectionItems.findIndex((item) => item.domPath === domPath);
		if (existingIndex >= 0) {
			this.#groupSelectionItems = this.#groupSelectionItems.filter(
				(_, index) => index !== existingIndex
			);
		} else {
			this.#groupSelectionItems = [...this.#groupSelectionItems, { element: target, domPath }];
		}

		this.#refreshSelectionPreview();
		this.clearHover();
	}

	async #openPendingGroupComposer() {
		const elements = this.#groupSelectionItems
			.filter((item) => document.contains(item.element))
			.map((item) => item.element);

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

		const left = Math.min(this.#mouseDownState.x, event.clientX);
		const top = Math.min(this.#mouseDownState.y, event.clientY);
		const width = Math.abs(event.clientX - this.#mouseDownState.x);
		const height = Math.abs(event.clientY - this.#mouseDownState.y);
		const isTwoDimensionalDrag = width >= DRAG_THRESHOLD && height >= DRAG_THRESHOLD;

		if (!this.#dragActive && !isTwoDimensionalDrag) {
			return;
		}

		if (!this.#dragActive) {
			this.#dragActive = true;
			this.#setDragUserSelectSuppressed(true);
			window.getSelection()?.removeAllRanges();
		}

		let highlightRects: RectBox[] = [];
		const now = Date.now();
		if (now - this.#lastDragUpdate >= DRAG_UPDATE_THROTTLE) {
			this.#lastDragUpdate = now;
			highlightRects = this.#findSelectableElementsInRect({ left, top, width, height }).map(
				(element) => {
					const rect = element.getBoundingClientRect();
					return {
						left: rect.left,
						top: rect.top,
						width: rect.width,
						height: rect.height
					};
				}
			);
		} else if (this.dragSelection) {
			highlightRects = this.dragSelection.highlightRects;
		}

		this.dragSelection = {
			left,
			top,
			width,
			height,
			highlightRects
		};
	}

	async #finalizeDragSelection(selection: DragSelectionState) {
		if (selection.width < DRAG_THRESHOLD || selection.height < DRAG_THRESHOLD) return;

		const elements = this.#findSelectableElementsInRect(selection);
		if (elements.length > 0) {
			await this.#openGroupComposer(elements, elements[elements.length - 1]);
			return;
		}

		const visuals = buildAreaComposerVisuals(selection);
		const anchor = createAreaAnchorFromBounds(selection, visuals.markerLeft, visuals.markerTop);
		this.composer = buildComposerState({
			noteId: null,
			noteKind: 'area',
			initialValue: '',
			targetSummary: buildAreaTargetSummary(),
			targetLabel: buildAreaTargetLabel(selection),
			placeholder: getComposerPlaceholder('area'),
			accentColor: GROUP_SELECTION_COLOR,
			markerLeft: visuals.markerLeft,
			markerTop: visuals.markerTop,
			outlineRects: [selection],
			highlightRects: [],
			selectedText: null,
			anchor,
			sourceInfo: createEmptySourceInfo()
		});
		this.noteDraft = '';
		this.clearHover();
	}

	#findSelectableElementsInRect(selection: RectBox) {
		const selector = this.#selector
			? `${this.#selector}, ${this.#selector} ${DRAG_CANDIDATE_SELECTOR}`
			: DRAG_CANDIDATE_SELECTOR;
		const allCandidates = Array.from(document.querySelectorAll(selector))
			.filter((element): element is Element => element instanceof Element)
			.filter((element) => !isInspectorUiTarget(element))
			.filter((element) => matchesSelectorScope(element, this.#selector));

		const matching = allCandidates.filter((element) => {
			const rect = element.getBoundingClientRect();
			if (rect.width < 10 || rect.height < 10) return false;

			return (
				rect.left < selection.left + selection.width &&
				rect.left + rect.width > selection.left &&
				rect.top < selection.top + selection.height &&
				rect.top + rect.height > selection.top
			);
		});

		return matching.filter(
			(element) => !matching.some((other) => other !== element && element.contains(other))
		);
	}

	#getActiveTextSelection() {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;

		const serialized = serializeTextSelection(selection);
		if (!serialized) return null;
		if (isInspectorUiTarget(serialized.commonAncestor)) return null;
		if (!matchesSelectorScope(serialized.commonAncestor, this.#selector)) return null;
		return serialized;
	}

	async #openElementComposer(
		target: Element,
		clientX: number,
		clientY: number,
		noteId: string | null,
		initialValue: string
	) {
		const anchor = buildAnchorFromClick(target, clientX, clientY);
		if (!anchor) return false;

		const hoverInfo =
			target === this.#lastTarget && this.hoverInfo !== null
				? this.hoverInfo
				: await this.#resolveHoverInfo(target, clientX, clientY);

		const rect = target.getBoundingClientRect();
		const markerLeft = clampNumber(
			rect.left + rect.width * anchor.relativeX,
			12,
			window.innerWidth - 12
		);
		const markerTop = clampNumber(
			rect.top + rect.height * anchor.relativeY,
			12,
			window.innerHeight - 12
		);

		this.#lastTarget = target;
		this.hoverInfo = hoverInfo;
		this.activeNoteId = noteId;
		this.noteDraft = initialValue;
		this.composer = buildComposerState({
			noteId,
			noteKind: 'element',
			initialValue,
			targetSummary: buildElementTargetSummary(target),
			targetLabel: buildElementTargetLabel(target),
			placeholder: getComposerPlaceholder('element'),
			accentColor: this.settings.markerColor,
			markerLeft,
			markerTop,
			outlineRects: [
				{
					left: rect.left,
					top: rect.top,
					width: rect.width,
					height: rect.height
				}
			],
			highlightRects: [],
			selectedText: null,
			anchor,
			sourceInfo: buildSourceInfoFromHoverInfo(hoverInfo)
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
		this.composer = buildComposerState({
			noteId: null,
			noteKind: 'text',
			initialValue: '',
			targetSummary: buildTextTargetSummary(
				selection.commonAncestor,
				selection.anchor.selectedText
			),
			targetLabel: buildTextTargetLabel(selection.commonAncestor),
			placeholder: getComposerPlaceholder('text'),
			accentColor: this.settings.markerColor,
			markerLeft: selection.markerLeft,
			markerTop: selection.markerTop,
			outlineRects: selection.bounds ? [selection.bounds] : [],
			highlightRects: selection.rects,
			selectedText: selection.anchor.selectedText,
			anchor: selection.anchor,
			sourceInfo
		});
		window.getSelection()?.removeAllRanges();
		this.clearHover();
		return true;
	}

	async #openGroupComposer(elements: Element[], anchorElement: Element) {
		const rects = elements.map((element) => {
			const rect = element.getBoundingClientRect();
			return {
				left: rect.left,
				top: rect.top,
				width: rect.width,
				height: rect.height
			};
		});
		const visuals = buildGroupSelectionFromRects(rects);
		if (!visuals) return false;

		const anchorData = createGroupAnchorFromElements(
			elements,
			anchorElement,
			visuals.markerLeft,
			visuals.markerTop
		);
		if (!anchorData) return false;

		const anchorRect = anchorElement.getBoundingClientRect();
		const sourceInfo = await this.#resolveSourceInfo(
			anchorElement,
			anchorRect.left + anchorRect.width / 2,
			anchorRect.top + anchorRect.height / 2
		);

		this.activeNoteId = null;
		this.noteDraft = '';
		this.composer = buildComposerState({
			noteId: null,
			noteKind: 'group',
			initialValue: '',
			targetSummary: buildGroupTargetSummary(elements),
			targetLabel: buildGroupTargetLabel(elements),
			placeholder: getComposerPlaceholder('group', elements.length),
			accentColor: GROUP_SELECTION_COLOR,
			markerLeft: visuals.markerLeft,
			markerTop: visuals.markerTop,
			outlineRects: anchorData.rects,
			highlightRects: [],
			selectedText: null,
			anchor: anchorData.anchor,
			sourceInfo
		});
		this.clearHover();
		return true;
	}

	#setComposerFromExistingNote(note: InspectorNote) {
		const renderedNote = renderNote(note);
		const fallbackMarker = this.#getFallbackMarkerForNote(note);
		const markerLeft = renderedNote.position?.markerLeft ?? fallbackMarker.markerLeft;
		const markerTop = renderedNote.position?.markerTop ?? fallbackMarker.markerTop;
		const outlineRects = renderedNote.position?.outlineRects ?? [];
		const highlightRects = renderedNote.position?.highlightRects ?? [];

		this.noteDraft = note.note;
		this.composer = buildComposerState({
			noteId: note.id,
			noteKind: note.kind,
			initialValue: note.note,
			targetSummary: note.targetSummary,
			targetLabel: note.targetLabel,
			placeholder:
				note.kind === 'group'
					? getComposerPlaceholder('group', note.anchor.selectedDomPaths.length)
					: getComposerPlaceholder(note.kind),
			accentColor:
				note.kind === 'group' || note.kind === 'area'
					? GROUP_SELECTION_COLOR
					: this.settings.markerColor,
			markerLeft,
			markerTop,
			outlineRects,
			highlightRects,
			selectedText: note.kind === 'text' ? note.anchor.selectedText : null,
			anchor: note.anchor,
			sourceInfo: {
				componentName: note.componentName,
				tagName: note.tagName,
				filePath: note.filePath,
				shortFileName: note.shortFileName,
				lineNumber: note.lineNumber,
				columnNumber: note.columnNumber
			}
		});
	}

	#getFallbackMarkerForNote(note: InspectorNote) {
		switch (note.kind) {
			case 'element':
				return {
					markerLeft: clampNumber(note.anchor.viewportX, 12, window.innerWidth - 12),
					markerTop: clampNumber(note.anchor.viewportY, 12, window.innerHeight - 12)
				};
			case 'text':
			case 'group':
			case 'area':
				return markerFromFallback(note.anchor.fallbackMarker);
		}
	}

	#refreshComposerLayout() {
		if (!this.composer) return;

		switch (this.composer.noteKind) {
			case 'element': {
				const target = resolveDomPath((this.composer.anchor as ElementNoteAnchor).domPath);
				if (!target) {
					const anchor = this.composer.anchor as ElementNoteAnchor;
					this.#updateComposerPosition(
						clampNumber(anchor.viewportX, 12, window.innerWidth - 12),
						clampNumber(anchor.viewportY, 12, window.innerHeight - 12),
						[],
						[]
					);
					return;
				}

				const rect = target.getBoundingClientRect();
				const anchor = this.composer.anchor as ElementNoteAnchor;
				const markerLeft = clampNumber(
					rect.left + rect.width * anchor.relativeX,
					12,
					window.innerWidth - 12
				);
				const markerTop = clampNumber(
					rect.top + rect.height * anchor.relativeY,
					12,
					window.innerHeight - 12
				);
				this.#updateComposerPosition(
					markerLeft,
					markerTop,
					[
						{
							left: rect.left,
							top: rect.top,
							width: rect.width,
							height: rect.height
						}
					],
					[]
				);
				return;
			}
			case 'text': {
				const resolved = resolveTextSelection(this.composer.anchor as TextSelectionAnchor);
				if (!resolved) {
					const fallback = markerFromFallback(
						(this.composer.anchor as TextSelectionAnchor).fallbackMarker
					);
					this.#updateComposerPosition(fallback.markerLeft, fallback.markerTop, [], []);
					return;
				}

				this.#updateComposerPosition(
					resolved.markerLeft,
					resolved.markerTop,
					resolved.bounds ? [resolved.bounds] : [],
					resolved.rects
				);
				return;
			}
			case 'group': {
				const resolved = resolveGroupSelection(this.composer.anchor as GroupSelectionAnchor);
				if (!resolved) {
					const fallback = markerFromFallback(
						(this.composer.anchor as GroupSelectionAnchor).fallbackMarker
					);
					this.#updateComposerPosition(fallback.markerLeft, fallback.markerTop, [], []);
					return;
				}

				this.#updateComposerPosition(resolved.markerLeft, resolved.markerTop, resolved.rects, []);
				return;
			}
			case 'area': {
				const resolved = resolveAreaSelection(this.composer.anchor as AreaSelectionAnchor);
				this.#updateComposerPosition(
					resolved.markerLeft,
					resolved.markerTop,
					[resolved.bounds],
					[]
				);
			}
		}
	}

	#updateComposerPosition(
		markerLeft: number,
		markerTop: number,
		outlineRects: RectBox[],
		highlightRects: RectBox[]
	) {
		if (!this.composer) return;

		this.composer = buildComposerState({
			noteId: this.composer.noteId,
			noteKind: this.composer.noteKind,
			initialValue: this.composer.initialValue,
			targetSummary: this.composer.targetSummary,
			targetLabel: this.composer.targetLabel,
			placeholder: this.composer.placeholder,
			accentColor: this.composer.accentColor,
			markerLeft,
			markerTop,
			outlineRects,
			highlightRects,
			selectedText: this.composer.selectedText,
			anchor: this.composer.anchor,
			sourceInfo: {
				componentName: this.composer.componentName,
				tagName: this.composer.tagName,
				filePath: this.composer.filePath,
				shortFileName: this.composer.shortFileName,
				lineNumber: this.composer.lineNumber,
				columnNumber: this.composer.columnNumber
			}
		});
	}

	async #scrollNoteIntoView(note: InspectorNote) {
		switch (note.kind) {
			case 'element': {
				const target = resolveDomPath(note.anchor.domPath);
				target?.scrollIntoView({
					block: 'center',
					inline: 'nearest',
					behavior: 'smooth'
				});
				return;
			}
			case 'text': {
				const target = resolveDomPath(note.anchor.commonAncestorPath);
				target?.scrollIntoView({
					block: 'center',
					inline: 'nearest',
					behavior: 'smooth'
				});
				return;
			}
			case 'group': {
				const target =
					resolveDomPath(note.anchor.anchorDomPath) ??
					resolveDomPath(note.anchor.selectedDomPaths[0] ?? '');
				target?.scrollIntoView({
					block: 'center',
					inline: 'nearest',
					behavior: 'smooth'
				});
				return;
			}
			case 'area': {
				window.scrollTo({
					top: Math.max(0, note.anchor.bounds.top - window.innerHeight / 2),
					behavior: 'smooth'
				});
			}
		}
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

	#installCursorStyles() {
		if (this.#cursorStyleElement) return;
		const style = document.createElement('style');
		style.id = 'copy-open-cursor-styles';
		style.textContent = `
			body * {
				cursor: crosshair !important;
			}
			body p,
			body span,
			body h1,
			body h2,
			body h3,
			body h4,
			body h5,
			body h6,
			body li,
			body td,
			body th,
			body label,
			body blockquote,
			body figcaption,
			body caption,
			body legend,
			body dt,
			body dd,
			body pre,
			body code,
			body em,
			body strong,
			body b,
			body i,
			body u,
			body s,
			body a,
			body time,
			body address,
			body cite,
			body q,
			body abbr,
			body dfn,
			body p *,
			body span *,
			body h1 *,
			body h2 *,
			body h3 *,
			body h4 *,
			body h5 *,
			body h6 *,
			body li *,
			body a *,
			body label *,
			body pre *,
			body code *,
			body blockquote *,
			body [contenteditable],
			body [contenteditable] * {
				cursor: text !important;
			}
			[data-inspector-ui],
			[data-inspector-ui] * {
				cursor: auto !important;
			}
			[data-inspector-ui] textarea,
			[data-inspector-ui] input[type="text"],
			[data-inspector-ui] input[type="url"] {
				cursor: text !important;
			}
			[data-inspector-ui] button,
			[data-inspector-ui] button *,
			[data-inspector-ui] label,
			[data-inspector-ui] label *,
			[data-inspector-ui] a,
			[data-inspector-ui] a * {
				cursor: pointer !important;
			}
		`;
		document.head.appendChild(style);
		this.#cursorStyleElement = style;
	}

	#removeCursorStyles() {
		this.#cursorStyleElement?.remove();
		this.#cursorStyleElement = null;
	}

	#setDragUserSelectSuppressed(active: boolean) {
		if (active) {
			if (this.#dragUserSelectSnapshot) return;
			this.#dragUserSelectSnapshot = {
				bodyUserSelect: document.body.style.userSelect,
				bodyWebkitUserSelect: document.body.style.webkitUserSelect,
				documentUserSelect: document.documentElement.style.userSelect,
				documentWebkitUserSelect: document.documentElement.style.webkitUserSelect
			};
			document.body.style.userSelect = 'none';
			document.body.style.webkitUserSelect = 'none';
			document.documentElement.style.userSelect = 'none';
			document.documentElement.style.webkitUserSelect = 'none';
			return;
		}

		if (!this.#dragUserSelectSnapshot) return;
		document.body.style.userSelect = this.#dragUserSelectSnapshot.bodyUserSelect;
		document.body.style.webkitUserSelect = this.#dragUserSelectSnapshot.bodyWebkitUserSelect;
		document.documentElement.style.userSelect = this.#dragUserSelectSnapshot.documentUserSelect;
		document.documentElement.style.webkitUserSelect =
			this.#dragUserSelectSnapshot.documentWebkitUserSelect;
		this.#dragUserSelectSnapshot = null;
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
