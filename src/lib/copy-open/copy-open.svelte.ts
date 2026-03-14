import { resolveElementInfo } from 'element-source';

import type {
	ElementNoteAnchor,
	InspectorHoverInfo,
	InspectorNote,
	InspectorRuntimeOptions,
	NoteComposerState,
	NotesSettings,
	RenderedInspectorNote,
	ToolbarCoordinates,
	ToolbarState,
	VsCodeScheme
} from './types';
import { buildDomPath, clampNumber, isTypingTarget, resolveDomPath, resolveInspectableTarget } from './utils/dom';
import {
	alignToolbarPositionForStateChange,
	buildElementTargetLabel,
	buildElementTargetSummary,
	clampToolbarPosition,
	createDefaultToolbarPosition,
	DEFAULT_NOTES_SETTINGS,
	formatNotesAsMarkdown,
	getComposerPosition,
	getPageStorageKey,
	readStoredMarkerColor,
	readStoredNotes,
	readStoredSettings,
	readStoredThemeMode,
	readStoredToolbarPosition,
	renderNote,
	writeStoredMarkerColor,
	writeStoredNotes,
	writeStoredSettings,
	writeStoredThemeMode,
	writeStoredToolbarPosition
} from './utils/notes';
import { buildHoverInfo, getHoverGeometry } from './utils/source';

const DEFAULT_OPTIONS: InspectorRuntimeOptions = {
	workspaceRoot: null,
	selector: null,
	vscodeScheme: 'vscode',
	openSourceOnClick: false
};

type ToolbarDragState = {
	pointerId: number | null;
	offsetX: number;
	offsetY: number;
	width: number;
	height: number;
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

const buildAnchorFromClick = (target: Element, clientX: number, clientY: number): ElementNoteAnchor | null => {
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

const buildComposerFromTarget = (
	target: Element,
	hoverInfo: InspectorHoverInfo,
	anchor: ElementNoteAnchor,
	noteId: string | null,
	initialValue: string
): NoteComposerState => {
	const rect = target.getBoundingClientRect();
	const markerLeft = clampNumber(rect.left + rect.width * anchor.relativeX, 12, window.innerWidth - 12);
	const markerTop = clampNumber(rect.top + rect.height * anchor.relativeY, 12, window.innerHeight - 12);
	const { panelLeft, panelTop } = getComposerPosition(markerLeft, markerTop);

	return {
		noteId,
		initialValue,
		targetSummary: buildElementTargetSummary(target),
		targetLabel: buildElementTargetLabel(target),
		markerLeft,
		markerTop,
		panelLeft,
		panelTop,
		targetRect: {
			left: rect.left,
			top: rect.top,
			width: rect.width,
			height: rect.height
		},
		anchor,
		hoverInfo
	};
};

export class CopyOpenController {
	enabled = $state(false);
	hoverInfo = $state<InspectorHoverInfo | null>(null);
	copied = $state(false);
	toolbar = $state<ToolbarState>(createToolbarState());
	settings = $state<NotesSettings>(DEFAULT_NOTES_SETTINGS);
	notes = $state<InspectorNote[]>([]);
	renderedNotes = $state<RenderedInspectorNote[]>([]);
	composer = $state<NoteComposerState | null>(null);
	noteDraft = $state('');
	activeNoteId = $state<string | null>(null);

	#lastTarget: Element | null = null;
	#workspaceRoot: string | null = DEFAULT_OPTIONS.workspaceRoot;
	#selector: string | null = DEFAULT_OPTIONS.selector;
	#vscodeScheme: VsCodeScheme = DEFAULT_OPTIONS.vscodeScheme;
	#openSourceOnClick = DEFAULT_OPTIONS.openSourceOnClick;
	#copyResetTimer: ReturnType<typeof setTimeout> | null = null;
	#toolbarCopyResetTimer: ReturnType<typeof setTimeout> | null = null;
	#toolbarDrag: ToolbarDragState = { pointerId: null, offsetX: 0, offsetY: 0, width: 0, height: 0 };
	#pageStorageKey = 'unknown-page';

	constructor(options: Partial<InspectorRuntimeOptions> = {}) {
		this.updateOptions(options);

		if (typeof window !== 'undefined') {
			this.#pageStorageKey = getPageStorageKey();
			this.toolbar = {
				...this.toolbar,
				position: readStoredToolbarPosition()
			};
			const storedSettings = readStoredSettings();
			const themeMode = readStoredThemeMode() ?? DEFAULT_NOTES_SETTINGS.themeMode;
			const markerColor = readStoredMarkerColor() ?? DEFAULT_NOTES_SETTINGS.markerColor;

			writeStoredThemeMode(themeMode);
			writeStoredMarkerColor(markerColor);

			this.settings = {
				...storedSettings,
				themeMode,
				markerColor
			};
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
	}

	toggle = () => {
		this.enabled = !this.enabled;
		this.#setToolbar({
			confirmDeleteAll: false
		});

		if (!this.enabled) {
			this.closeComposer();
			this.clearHover();
		}
	};

	toggleToolbar = () => {
		const expanded = !this.toolbar.expanded;
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
		writeStoredToolbarPosition(nextPosition);
	};

	closeToolbar = () => {
		const nextPosition = alignToolbarPositionForStateChange(this.toolbar.position, true, false);

		this.#setToolbar({
			expanded: false,
			settingsOpen: false,
			confirmDeleteAll: false,
			position: nextPosition
		});
		writeStoredToolbarPosition(nextPosition);
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
		this.confirmDeleteAll();
	};

	cancelDeleteAll = () => {
		this.#setToolbar({ confirmDeleteAll: false });
	};

	confirmDeleteAll = () => {
		this.notes = [];
		this.renderedNotes = [];
		this.activeNoteId = null;
		this.closeComposer();
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

		if (!this.enabled || this.composer) return;

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
		if (this.#lastTarget !== target || !this.enabled || this.composer) return;

		this.copied = false;
		this.#clearCopyResetTimer();
		this.hoverInfo = hoverInfo;
	};

	handlePointerUp = (event: PointerEvent) => {
		if (!this.toolbar.dragging) return;
		if (this.#toolbarDrag.pointerId !== null && event.pointerId !== this.#toolbarDrag.pointerId) return;

		this.#toolbarDrag = { pointerId: null, offsetX: 0, offsetY: 0, width: 0, height: 0 };
		this.#setToolbar({ dragging: false });
		writeStoredToolbarPosition(this.toolbar.position);
	};

	handleViewportChange = () => {
		if (!this.composer) {
			this.clearHover();
		}

		this.#setToolbar({
			position: clampToolbarPosition(this.toolbar.position, this.toolbar.expanded)
		});
		writeStoredToolbarPosition(this.toolbar.position);
		this.refreshRenderedNotes();
		this.#refreshComposerLayout();
	};

	handleClick = async (event: MouseEvent) => {
		if (event.defaultPrevented) return;
		if (event.button !== 0) return;
		if (!this.enabled) return;

		const target = resolveInspectableTarget(event.target, this.#selector);
		if (!target) return;

		if (this.settings.blockPageInteractions) {
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
		}

		const anchor = buildAnchorFromClick(target, event.clientX, event.clientY);
		if (!anchor) return;

		const hoverInfo =
			target === this.#lastTarget && this.hoverInfo !== null
				? this.hoverInfo
				: await this.#resolveHoverInfo(target, event.clientX, event.clientY);

		this.#lastTarget = target;
		this.hoverInfo = hoverInfo;
		this.activeNoteId = null;
		this.noteDraft = '';
		this.composer = buildComposerFromTarget(target, hoverInfo, anchor, null, '');
	};

	handleKeyDown = async (event: KeyboardEvent) => {
		if (event.defaultPrevented) return;

		const key = event.key.toLowerCase();
		if (key === 'escape') {
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
	};

	saveComposer = () => {
		if (!this.composer) return false;

		const noteText = this.noteDraft.trim();
		if (!noteText) return false;

		const now = new Date().toISOString();
		const existingNote = this.composer.noteId
			? this.notes.find((note) => note.id === this.composer?.noteId) ?? null
			: null;

		const nextNote: InspectorNote = {
			id: existingNote?.id ?? this.#createNoteId(),
			note: noteText,
			targetSummary: this.composer.targetSummary,
			componentName: this.composer.hoverInfo.componentName,
			tagName: this.composer.hoverInfo.tagName,
			filePath: this.composer.hoverInfo.filePath,
			shortFileName: this.composer.hoverInfo.shortFileName,
			lineNumber: this.composer.hoverInfo.lineNumber,
			columnNumber: this.composer.hoverInfo.columnNumber,
			createdAt: existingNote?.createdAt ?? now,
			updatedAt: now,
			anchor: this.composer.anchor
		};

		this.notes = existingNote
			? this.notes.map((note) => (note.id === nextNote.id ? nextNote : note))
			: [...this.notes, nextNote];

		this.activeNoteId = nextNote.id;
		this.closeComposer();
		this.#persistNotes();
		this.refreshRenderedNotes();
		return true;
	};

	openNote = async (noteId: string) => {
		const note = this.notes.find((entry) => entry.id === noteId);
		if (!note) return false;

		const target = resolveDomPath(note.anchor.domPath);
		if (!target) {
			this.activeNoteId = note.id;
			return false;
		}

		target.scrollIntoView({
			block: 'center',
			inline: 'nearest',
			behavior: 'smooth'
		});

		const rect = target.getBoundingClientRect();
		const hoverInfo = await this.#resolveHoverInfo(
			target,
			rect.left + rect.width / 2,
			rect.top + Math.min(rect.height / 2, 24)
		);
		this.composer = buildComposerFromTarget(target, hoverInfo, note.anchor, note.id, note.note);
		this.noteDraft = note.note;
		this.activeNoteId = note.id;
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

		this.#persistNotes();
	};

	refreshRenderedNotes = () => {
		this.renderedNotes = this.notes.map(renderNote);
	};

	destroy() {
		this.#clearCopyResetTimer();
		this.#clearToolbarCopyResetTimer();
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

	#refreshComposerLayout() {
		if (!this.composer) return;

		const target = resolveDomPath(this.composer.anchor.domPath);
		if (!target) {
			this.closeComposer();
			return;
		}

		const rect = target.getBoundingClientRect();
		const markerLeft = clampNumber(
			rect.left + rect.width * this.composer.anchor.relativeX,
			12,
			window.innerWidth - 12
		);
		const markerTop = clampNumber(
			rect.top + rect.height * this.composer.anchor.relativeY,
			12,
			window.innerHeight - 12
		);
		const { panelLeft, panelTop } = getComposerPosition(markerLeft, markerTop);

		this.composer = {
			...this.composer,
			markerLeft,
			markerTop,
			panelLeft,
			panelTop,
			targetRect: {
				left: rect.left,
				top: rect.top,
				width: rect.width,
				height: rect.height
			}
		};
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
