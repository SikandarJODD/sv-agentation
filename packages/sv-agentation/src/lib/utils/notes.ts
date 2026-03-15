import type {
	AreaInspectorNote,
	ElementInspectorNote,
	InspectorHoverInfo,
	InspectorNote,
	NoteComposerState,
	NoteResolutionState,
	NoteSourceInfo,
	NotesSettings,
	RectBox,
	RenderedInspectorNote,
	ResolvedNotePosition,
	TextInspectorNote,
	ThemeMode,
	ToolbarCoordinates
} from '../types';
import { clampNumber, getElementTextPreview, getTagLabel, resolveDomPath } from './dom';
import {
	buildAreaSelectionAnchor,
	buildGroupSelectionAnchor,
	getBoundsFromRects,
	markerFromFallback,
	resolveAreaSelection,
	resolveGroupSelection,
	resolveTextSelection
} from './selection';

const STORAGE_PREFIX = 'sv-agentation';
const LEGACY_STORAGE_PREFIX = 'copy-open';
const SETTINGS_STORAGE_KEY = `${STORAGE_PREFIX}:settings:v1`;
const LEGACY_SETTINGS_STORAGE_KEY = `${LEGACY_STORAGE_PREFIX}:settings:v1`;
const NOTES_STORAGE_PREFIX = `${STORAGE_PREFIX}:notes:v1:`;
const LEGACY_NOTES_STORAGE_PREFIX = `${LEGACY_STORAGE_PREFIX}:notes:v1:`;
const TOOLBAR_STORAGE_PREFIX = `${STORAGE_PREFIX}:toolbar:v1:`;
const LEGACY_TOOLBAR_STORAGE_PREFIX = `${LEGACY_STORAGE_PREFIX}:toolbar:v1:`;
const THEME_MODE_STORAGE_KEY = 'sv-agentation-theme-mode';
const MARKER_COLOR_STORAGE_KEY = 'sv-agentation-marker-color';

const TOOLBAR_MARGIN = 8;
export const DEFAULT_DELETE_ALL_DELAY_MS = 3000;
export const COLLAPSED_TOOLBAR_SIZE = 52;
export const EXPANDED_TOOLBAR_WIDTH = 266;
export const EXPANDED_TOOLBAR_HEIGHT = 52;
export const COMPOSER_WIDTH = 280;
export const COMPOSER_HEIGHT = 180;
export const CLAMPED_TOOLBAR_MARGIN = TOOLBAR_MARGIN;
const PANEL_GAP = 20;
export const GROUP_SELECTION_COLOR = '#14CE4C';
export const NO_SOURCE_VALUE = 'no-source-found';

export const DEFAULT_MARKER_COLORS = [
	'#6157F4',
	'#0A84FF',
	'#14B8D4',
	'#14CE4C',
	'#FACC15',
	'#FB8C00',
	'#FF1744'
] as const;

export const DEFAULT_NOTES_SETTINGS: NotesSettings = {
	markerColor: '#14CE4C',
	themeMode: 'dark',
	blockPageInteractions: true,
	outputDetail: 'standard'
};

const normalizeHexColor = (value: string) => {
	const normalized = value.trim();
	if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)) return null;

	if (normalized.length === 4) {
		return `#${normalized
			.slice(1)
			.split('')
			.map((segment) => `${segment}${segment}`)
			.join('')}`.toUpperCase();
	}

	return normalized.toUpperCase();
};

const hexToRgb = (value: string) => {
	const normalized = normalizeHexColor(value);
	if (!normalized) return null;

	const numeric = Number.parseInt(normalized.slice(1), 16);
	return {
		r: (numeric >> 16) & 255,
		g: (numeric >> 8) & 255,
		b: numeric & 255
	};
};

const rgbToRgba = (value: { r: number; g: number; b: number }, alpha: number) =>
	`rgba(${value.r}, ${value.g}, ${value.b}, ${alpha})`;

const getReadableOnColor = (value: { r: number; g: number; b: number }) => {
	const luminance = (0.2126 * value.r + 0.7152 * value.g + 0.0722 * value.b) / 255;
	return luminance > 0.62 ? '#17181C' : '#FFFFFF';
};

const readStoredJson = <Value>(key: string) => {
	if (typeof window === 'undefined') return null;

	try {
		const rawValue = window.localStorage.getItem(key);
		if (!rawValue) return null;
		return JSON.parse(rawValue) as Value;
	} catch {
		return null;
	}
};

const readStoredJsonFromKeys = <Value>(keys: string[]) => {
	for (const key of keys) {
		const value = readStoredJson<Value>(key);
		if (value !== null) return value;
	}

	return null;
};

const writeStoredJson = (key: string, value: unknown) => {
	if (typeof window === 'undefined') return;

	try {
		window.localStorage.setItem(key, JSON.stringify(value));
	} catch {
		return;
	}
};

export const truncateText = (value: string, maxLength = 40) => {
	if (value.length <= maxLength) return value;
	return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
};

const collapseWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

export const getPageStorageKey = () => {
	if (typeof window === 'undefined') return 'unknown-page';
	return `${window.location.origin}${window.location.pathname}${window.location.search}`;
};

export const buildNotesStorageKey = (pageStorageKey: string) =>
	`${NOTES_STORAGE_PREFIX}${encodeURIComponent(pageStorageKey)}`;

const buildLegacyNotesStorageKey = (pageStorageKey: string) =>
	`${LEGACY_NOTES_STORAGE_PREFIX}${encodeURIComponent(pageStorageKey)}`;

export const buildToolbarStorageKey = (pageStorageKey: string) =>
	`${TOOLBAR_STORAGE_PREFIX}${encodeURIComponent(pageStorageKey)}`;

const buildLegacyToolbarStorageKey = (pageStorageKey: string) =>
	`${LEGACY_TOOLBAR_STORAGE_PREFIX}${encodeURIComponent(pageStorageKey)}`;

export const sanitizeDeleteAllDelayMs = (value: number | null | undefined) =>
	typeof value === 'number' && Number.isFinite(value) && value > 0
		? value
		: DEFAULT_DELETE_ALL_DELAY_MS;

const isToolbarCoordinates = (value: unknown): value is ToolbarCoordinates => {
	if (!value || typeof value !== 'object') return false;

	const candidate = value as Partial<ToolbarCoordinates>;
	return (
		typeof candidate.x === 'number' &&
		Number.isFinite(candidate.x) &&
		typeof candidate.y === 'number' &&
		Number.isFinite(candidate.y)
	);
};

export const createDefaultToolbarPosition = (): ToolbarCoordinates => {
	if (typeof window === 'undefined') {
		return { x: TOOLBAR_MARGIN, y: TOOLBAR_MARGIN };
	}

	return {
		x: Math.max(TOOLBAR_MARGIN, window.innerWidth - COLLAPSED_TOOLBAR_SIZE - TOOLBAR_MARGIN),
		y: Math.max(TOOLBAR_MARGIN, window.innerHeight - COLLAPSED_TOOLBAR_SIZE - TOOLBAR_MARGIN)
	};
};

export const clampToolbarPosition = (
	position: ToolbarCoordinates,
	expanded: boolean,
	size?: {
		width?: number;
		height?: number;
	}
): ToolbarCoordinates => {
	if (typeof window === 'undefined') return position;

	const width = Math.max(
		1,
		Math.ceil(size?.width ?? (expanded ? EXPANDED_TOOLBAR_WIDTH : COLLAPSED_TOOLBAR_SIZE))
	);
	const height = Math.max(
		1,
		Math.ceil(size?.height ?? (expanded ? EXPANDED_TOOLBAR_HEIGHT : COLLAPSED_TOOLBAR_SIZE))
	);

	return {
		x: clampNumber(
			position.x,
			TOOLBAR_MARGIN,
			Math.max(TOOLBAR_MARGIN, window.innerWidth - width - TOOLBAR_MARGIN)
		),
		y: clampNumber(
			position.y,
			TOOLBAR_MARGIN,
			Math.max(TOOLBAR_MARGIN, window.innerHeight - height - TOOLBAR_MARGIN)
		)
	};
};

export const alignToolbarPositionForStateChange = (
	position: ToolbarCoordinates,
	fromExpanded: boolean,
	toExpanded: boolean,
	alignment: {
		horizontal: 'left' | 'center' | 'right';
		vertical: 'top' | 'middle' | 'bottom';
	} = {
		horizontal: 'right',
		vertical: 'bottom'
	}
) => {
	const fromWidth = fromExpanded ? EXPANDED_TOOLBAR_WIDTH : COLLAPSED_TOOLBAR_SIZE;
	const fromHeight = fromExpanded ? EXPANDED_TOOLBAR_HEIGHT : COLLAPSED_TOOLBAR_SIZE;
	const toWidth = toExpanded ? EXPANDED_TOOLBAR_WIDTH : COLLAPSED_TOOLBAR_SIZE;
	const toHeight = toExpanded ? EXPANDED_TOOLBAR_HEIGHT : COLLAPSED_TOOLBAR_SIZE;
	const horizontalDelta =
		alignment.horizontal === 'left'
			? 0
			: alignment.horizontal === 'center'
				? (fromWidth - toWidth) / 2
				: fromWidth - toWidth;
	const verticalDelta =
		alignment.vertical === 'top'
			? 0
			: alignment.vertical === 'middle'
				? (fromHeight - toHeight) / 2
				: fromHeight - toHeight;

	return clampToolbarPosition(
		{
			x: position.x + horizontalDelta,
			y: position.y + verticalDelta
		},
		toExpanded,
		{
			width: toWidth,
			height: toHeight
		}
	);
};

export const readStoredThemeMode = () => {
	const storedThemeMode = readStoredJson<string>(THEME_MODE_STORAGE_KEY);
	if (storedThemeMode === 'dark' || storedThemeMode === 'light') {
		return storedThemeMode as ThemeMode;
	}

	return null;
};

export const writeStoredThemeMode = (themeMode: ThemeMode) => {
	writeStoredJson(THEME_MODE_STORAGE_KEY, themeMode);
};

export const readStoredMarkerColor = () => {
	const storedMarkerColor = readStoredJson<string>(MARKER_COLOR_STORAGE_KEY);
	if (
		typeof storedMarkerColor === 'string' &&
		DEFAULT_MARKER_COLORS.includes(storedMarkerColor as (typeof DEFAULT_MARKER_COLORS)[number])
	) {
		return storedMarkerColor;
	}

	return null;
};

export const writeStoredMarkerColor = (markerColor: string) => {
	writeStoredJson(MARKER_COLOR_STORAGE_KEY, markerColor);
};

export const buildMarkerOutlineVars = (markerColor: string) => {
	const rgb = hexToRgb(markerColor);
	if (!rgb) {
		return {
			border: 'rgba(20, 206, 76, 0.82)',
			background: 'rgba(20, 206, 76, 0.08)',
			inner: 'rgba(20, 206, 76, 0.12)',
			foreground: '#FFFFFF'
		};
	}

	return {
		border: rgbToRgba(rgb, 0.82),
		background: rgbToRgba(rgb, 0.08),
		inner: rgbToRgba(rgb, 0.12),
		foreground: getReadableOnColor(rgb)
	};
};

export const readStoredSettings = () => {
	const storedSettings = readStoredJsonFromKeys<Partial<NotesSettings>>([
		SETTINGS_STORAGE_KEY,
		LEGACY_SETTINGS_STORAGE_KEY
	]);
	if (!storedSettings) return DEFAULT_NOTES_SETTINGS;

	return {
		markerColor: DEFAULT_NOTES_SETTINGS.markerColor,
		themeMode: DEFAULT_NOTES_SETTINGS.themeMode,
		blockPageInteractions:
			typeof storedSettings.blockPageInteractions === 'boolean'
				? storedSettings.blockPageInteractions
				: DEFAULT_NOTES_SETTINGS.blockPageInteractions,
		outputDetail:
			storedSettings.outputDetail === 'detailed' || storedSettings.outputDetail === 'standard'
				? storedSettings.outputDetail
				: DEFAULT_NOTES_SETTINGS.outputDetail
	} satisfies NotesSettings;
};

export const readStoredToolbarPosition = (pageStorageKey: string) => {
	const storedPosition = readStoredJsonFromKeys<unknown>([
		buildToolbarStorageKey(pageStorageKey),
		buildLegacyToolbarStorageKey(pageStorageKey)
	]);
	return isToolbarCoordinates(storedPosition) ? storedPosition : null;
};

export const writeStoredToolbarPosition = (
	pageStorageKey: string,
	position: ToolbarCoordinates
) => {
	writeStoredJson(buildToolbarStorageKey(pageStorageKey), position);
};

export const writeStoredSettings = (settings: NotesSettings) => {
	writeStoredJson(SETTINGS_STORAGE_KEY, {
		blockPageInteractions: settings.blockPageInteractions,
		outputDetail: settings.outputDetail
	});
};

const isNoteSourceInfo = (value: unknown): value is NoteSourceInfo => {
	if (!value || typeof value !== 'object') return false;
	const candidate = value as Partial<NoteSourceInfo>;
	return (
		typeof candidate.tagName === 'string' &&
		typeof candidate.filePath === 'string' &&
		typeof candidate.shortFileName === 'string'
	);
};

const toLegacyElementNote = (value: unknown): InspectorNote | null => {
	if (!value || typeof value !== 'object') return null;

	const note = value as {
		id?: unknown;
		note?: unknown;
		targetSummary?: unknown;
		componentName?: unknown;
		tagName?: unknown;
		filePath?: unknown;
		shortFileName?: unknown;
		lineNumber?: unknown;
		columnNumber?: unknown;
		createdAt?: unknown;
		updatedAt?: unknown;
		anchor?: {
			domPath?: unknown;
			relativeX?: unknown;
			relativeY?: unknown;
			viewportX?: unknown;
			viewportY?: unknown;
		};
		targetLabel?: unknown;
	};

	if (
		typeof note.id !== 'string' ||
		typeof note.note !== 'string' ||
		typeof note.targetSummary !== 'string' ||
		typeof note.tagName !== 'string' ||
		typeof note.filePath !== 'string' ||
		typeof note.shortFileName !== 'string' ||
		typeof note.anchor?.domPath !== 'string'
	) {
		return null;
	}

	return {
		id: note.id,
		kind: 'element',
		note: note.note,
		targetSummary: note.targetSummary,
		targetLabel: typeof note.targetLabel === 'string' ? note.targetLabel : note.targetSummary,
		componentName: typeof note.componentName === 'string' ? note.componentName : null,
		tagName: note.tagName,
		filePath: note.filePath,
		shortFileName: note.shortFileName,
		lineNumber: typeof note.lineNumber === 'number' ? note.lineNumber : null,
		columnNumber: typeof note.columnNumber === 'number' ? note.columnNumber : null,
		createdAt: typeof note.createdAt === 'string' ? note.createdAt : new Date().toISOString(),
		updatedAt: typeof note.updatedAt === 'string' ? note.updatedAt : new Date().toISOString(),
		anchor: {
			domPath: note.anchor.domPath,
			relativeX: typeof note.anchor.relativeX === 'number' ? note.anchor.relativeX : 0.5,
			relativeY: typeof note.anchor.relativeY === 'number' ? note.anchor.relativeY : 0.5,
			viewportX: typeof note.anchor.viewportX === 'number' ? note.anchor.viewportX : 0,
			viewportY: typeof note.anchor.viewportY === 'number' ? note.anchor.viewportY : 0
		}
	};
};

const isValidNote = (value: unknown): value is InspectorNote => {
	if (!value || typeof value !== 'object') return false;
	const candidate = value as Partial<InspectorNote> & Record<string, unknown>;

	if (
		typeof candidate.id !== 'string' ||
		typeof candidate.note !== 'string' ||
		typeof candidate.targetSummary !== 'string' ||
		typeof candidate.targetLabel !== 'string' ||
		typeof candidate.kind !== 'string' ||
		typeof candidate.tagName !== 'string' ||
		typeof candidate.filePath !== 'string' ||
		typeof candidate.shortFileName !== 'string'
	) {
		return false;
	}

	switch (candidate.kind) {
		case 'element':
			return typeof (candidate as ElementInspectorNote).anchor?.domPath === 'string';
		case 'text':
			return typeof (candidate as TextInspectorNote).anchor?.commonAncestorPath === 'string';
		case 'group':
			return Array.isArray(
				(candidate.anchor as { selectedDomPaths?: unknown[] })?.selectedDomPaths
			);
		case 'area':
			return (
				typeof (candidate.anchor as { bounds?: { left?: unknown } })?.bounds?.left === 'number'
			);
		default:
			return false;
	}
};

export const readStoredNotes = (pageStorageKey: string) => {
	const storedNotes = readStoredJsonFromKeys<unknown[]>([
		buildNotesStorageKey(pageStorageKey),
		buildLegacyNotesStorageKey(pageStorageKey)
	]);
	if (!Array.isArray(storedNotes)) return [] as InspectorNote[];

	return storedNotes
		.map((entry) => {
			if (isValidNote(entry)) return entry;
			return toLegacyElementNote(entry);
		})
		.filter((value): value is InspectorNote => value !== null);
};

export const writeStoredNotes = (pageStorageKey: string, notes: InspectorNote[]) => {
	writeStoredJson(buildNotesStorageKey(pageStorageKey), notes);
};

export const buildSourceInfoFromHoverInfo = (hoverInfo: InspectorHoverInfo): NoteSourceInfo => ({
	componentName: hoverInfo.componentName,
	tagName: hoverInfo.tagName,
	filePath: hoverInfo.filePath,
	shortFileName: hoverInfo.shortFileName,
	lineNumber: hoverInfo.lineNumber,
	columnNumber: hoverInfo.columnNumber
});

export const createEmptySourceInfo = (tagName = 'area'): NoteSourceInfo => ({
	componentName: null,
	tagName,
	filePath: NO_SOURCE_VALUE,
	shortFileName: NO_SOURCE_VALUE,
	lineNumber: null,
	columnNumber: null
});

export const buildElementTargetSummary = (target: Element) => {
	const label = getTagLabel(target.tagName);
	const textPreview = truncateText(getElementTextPreview(target), 34);

	if (!textPreview) {
		return label;
	}

	return `${label}: "${textPreview}"`;
};

export const buildElementTargetLabel = (target: Element) => {
	const label = getTagLabel(target.tagName);
	const textPreview = truncateText(getElementTextPreview(target), 82);

	if (!textPreview) {
		return label;
	}

	return `${label}: "${textPreview}"`;
};

const buildNamedSelectionList = (targets: Element[]) =>
	targets
		.slice(0, 3)
		.map((target) => buildElementTargetLabel(target))
		.join(', ');

export const buildGroupTargetSummary = (targets: Element[]) => {
	if (targets.length === 0) return 'Selected elements';
	if (targets.length === 1) return buildElementTargetSummary(targets[0]);

	const suffix = targets.length > 3 ? ` +${targets.length - 3} more` : '';
	return `${targets.length} elements: ${buildNamedSelectionList(targets)}${suffix}`;
};

export const buildGroupTargetLabel = (targets: Element[]) => {
	if (targets.length === 0) return 'Selected elements';
	if (targets.length === 1) return buildElementTargetLabel(targets[0]);

	const suffix = targets.length > 3 ? ` +${targets.length - 3} more` : '';
	return `${targets.length} elements: ${buildNamedSelectionList(targets)}${suffix}`;
};

export const buildAreaTargetSummary = () => 'Area selection';
export const buildAreaTargetLabel = (box: RectBox) =>
	`Area selection (${Math.round(box.width)} x ${Math.round(box.height)})`;

export const buildTextTargetSummary = (target: Element, selectedText: string) => {
	const base = buildElementTargetSummary(target);
	const preview = truncateText(collapseWhitespace(selectedText), 48);
	return preview ? `${base} -> "${preview}"` : base;
};

export const buildTextTargetLabel = (target: Element) => buildElementTargetLabel(target);

export const getComposerPlaceholder = (kind: InspectorNote['kind'], elementCount = 1) => {
	if (kind === 'group' && elementCount > 1) {
		return 'Feedback for this group of elements...';
	}

	return 'What should change ?';
};

const resolveElementNotePosition = (note: ElementInspectorNote): ResolvedNotePosition | null => {
	const target = resolveDomPath(note.anchor.domPath);
	if (!target) return null;

	const rect = target.getBoundingClientRect();
	const markerLeft = clampNumber(
		rect.left + rect.width * note.anchor.relativeX,
		12,
		window.innerWidth - 12
	);
	const markerTop = clampNumber(
		rect.top + rect.height * note.anchor.relativeY,
		12,
		window.innerHeight - 12
	);
	const bounds = {
		left: rect.left,
		top: rect.top,
		width: rect.width,
		height: rect.height
	};

	return {
		markerLeft,
		markerTop,
		bounds,
		outlineRects: [bounds],
		highlightRects: []
	};
};

const resolveTextNotePosition = (note: TextInspectorNote) => {
	const resolved = resolveTextSelection(note.anchor);
	if (!resolved) return null;

	return {
		markerLeft: resolved.markerLeft,
		markerTop: resolved.markerTop,
		bounds: resolved.bounds,
		outlineRects: resolved.bounds ? [resolved.bounds] : [],
		highlightRects: resolved.rects
	};
};

const resolveGroupNotePosition = (note: Extract<InspectorNote, { kind: 'group' | 'area' }>) => {
	if (note.kind === 'group') {
		const resolved = resolveGroupSelection(note.anchor);
		if (!resolved) return null;
		return {
			position: {
				markerLeft: resolved.markerLeft,
				markerTop: resolved.markerTop,
				bounds: resolved.bounds,
				outlineRects: resolved.rects,
				highlightRects: []
			} satisfies ResolvedNotePosition,
			resolution:
				resolved.resolvedCount === note.anchor.selectedDomPaths.length ? 'resolved' : 'partial'
		};
	}

	const resolved = resolveAreaSelection(note.anchor);
	const position: ResolvedNotePosition = {
		markerLeft: resolved.markerLeft,
		markerTop: resolved.markerTop,
		bounds: resolved.bounds,
		outlineRects: [resolved.bounds],
		highlightRects: []
	};

	return {
		position,
		resolution: 'resolved' as NoteResolutionState
	};
};

export const renderNote = (note: InspectorNote): RenderedInspectorNote => {
	if (note.kind === 'element') {
		const position = resolveElementNotePosition(note);
		return {
			...note,
			resolution: position ? 'resolved' : 'unresolved',
			position: position ?? {
				markerLeft: clampNumber(note.anchor.viewportX, 12, window.innerWidth - 12),
				markerTop: clampNumber(note.anchor.viewportY, 12, window.innerHeight - 12),
				bounds: null,
				outlineRects: [],
				highlightRects: []
			}
		};
	}

	if (note.kind === 'text') {
		const position = resolveTextNotePosition(note);
		return {
			...note,
			resolution: position ? 'resolved' : 'unresolved',
			position: position ?? {
				...markerFromFallback(note.anchor.fallbackMarker),
				bounds: null,
				outlineRects: [],
				highlightRects: []
			}
		};
	}

	const groupResult = resolveGroupNotePosition(note);
	return {
		...note,
		resolution: (groupResult?.resolution ?? 'unresolved') as NoteResolutionState,
		position: groupResult?.position ?? {
			...markerFromFallback(note.anchor.fallbackMarker),
			bounds: null,
			outlineRects: [],
			highlightRects: []
		}
	};
};

export const getComposerPosition = (markerLeft: number, markerTop: number) => {
	if (typeof window === 'undefined') {
		return {
			panelLeft: markerLeft - COMPOSER_WIDTH / 2,
			panelTop: markerTop + PANEL_GAP
		};
	}

	let panelLeft = markerLeft - COMPOSER_WIDTH / 2;
	let panelTop = markerTop + PANEL_GAP;
	if (panelTop + COMPOSER_HEIGHT > window.innerHeight - 20) {
		panelTop = markerTop - COMPOSER_HEIGHT - PANEL_GAP;
	}

	return {
		panelLeft: clampNumber(panelLeft, 20, Math.max(20, window.innerWidth - COMPOSER_WIDTH - 20)),
		panelTop: clampNumber(panelTop, 20, Math.max(20, window.innerHeight - COMPOSER_HEIGHT - 20))
	};
};

export const formatLocation = (note: InspectorNote) => {
	if (!note.shortFileName || note.shortFileName === NO_SOURCE_VALUE) return 'Source unavailable';
	if (note.lineNumber === null || note.columnNumber === null) return note.shortFileName;

	return `${note.shortFileName}:${note.lineNumber}:${note.columnNumber}`;
};

const buildElementLocationPath = (target: Element | null, fallback: string) => {
	if (!target) return fallback;

	const segments: string[] = [];
	let current: Element | null = target;

	while (current && current !== document.body) {
		segments.unshift(current.tagName.toLowerCase());
		current = current.parentElement;
	}

	return segments.slice(-4).join(' > ') || fallback;
};

const getNoteLocationLabel = (note: InspectorNote) => {
	switch (note.kind) {
		case 'element':
			return buildElementLocationPath(resolveDomPath(note.anchor.domPath), note.tagName);
		case 'text':
			return buildElementLocationPath(resolveDomPath(note.anchor.commonAncestorPath), note.tagName);
		case 'group': {
			const paths = note.anchor.selectedDomPaths
				.map((path) => buildElementLocationPath(resolveDomPath(path), note.tagName))
				.slice(0, 3);
			return paths.join(' | ') || 'group selection';
		}
		case 'area':
			return `area (${Math.round(note.anchor.bounds.width)} x ${Math.round(note.anchor.bounds.height)})`;
	}
};

export const formatNotesAsMarkdown = (notes: InspectorNote[]) => {
	if (notes.length === 0) {
		return 'Page Feedback\n\nNo feedback added yet.';
	}

	return [
		'Page Feedback',
		'',
		...notes.flatMap((note, index) => {
			const lines = [
				`${index + 1}. ${note.targetSummary}`,
				`Location: ${getNoteLocationLabel(note)}`,
				`Feedback: ${note.note}`,
				`Source: ${formatLocation(note)}`
			];

			if (note.kind === 'text') {
				lines.splice(2, 0, `Selected text: "${collapseWhitespace(note.anchor.selectedText)}"`);
			}

			if (index < notes.length - 1) {
				lines.push('', '---', '');
			}

			return lines;
		})
	].join('\n');
};

export const buildComposerState = ({
	noteId,
	noteKind,
	initialValue,
	targetSummary,
	targetLabel,
	placeholder,
	accentColor,
	markerLeft,
	markerTop,
	outlineRects,
	highlightRects,
	selectedText,
	anchor,
	sourceInfo
}: {
	noteId: string | null;
	noteKind: InspectorNote['kind'];
	initialValue: string;
	targetSummary: string;
	targetLabel: string;
	placeholder: string;
	accentColor: string;
	markerLeft: number;
	markerTop: number;
	outlineRects: RectBox[];
	highlightRects: RectBox[];
	selectedText: string | null;
	anchor: InspectorNote['anchor'];
	sourceInfo: NoteSourceInfo;
}): NoteComposerState => {
	const { panelLeft, panelTop } = getComposerPosition(markerLeft, markerTop);

	return {
		noteId,
		noteKind,
		initialValue,
		targetSummary,
		targetLabel,
		placeholder,
		accentColor,
		markerLeft,
		markerTop,
		panelLeft,
		panelTop,
		outlineRects,
		highlightRects,
		selectedText,
		anchor,
		...sourceInfo
	};
};

export const buildAreaComposerVisuals = (bounds: RectBox) => {
	const markerLeft = clampNumber(bounds.left + bounds.width, 12, window.innerWidth - 12);
	const markerTop = clampNumber(bounds.top + bounds.height, 12, window.innerHeight - 12);
	return {
		bounds,
		markerLeft,
		markerTop
	};
};

export const buildGroupSelectionFromRects = (rects: RectBox[]) => {
	const bounds = getBoundsFromRects(rects);
	if (!bounds) return null;

	const markerLeft = clampNumber(bounds.left + bounds.width, 12, window.innerWidth - 12);
	const markerTop = clampNumber(bounds.top + bounds.height, 12, window.innerHeight - 12);
	return {
		bounds,
		markerLeft,
		markerTop
	};
};

export const createAreaAnchorFromBounds = (
	bounds: RectBox,
	markerLeft: number,
	markerTop: number
) => buildAreaSelectionAnchor(bounds, markerLeft, markerTop);

export const createGroupAnchorFromElements = (
	elements: Element[],
	anchorElement: Element,
	markerLeft: number,
	markerTop: number
) => buildGroupSelectionAnchor(elements, anchorElement, markerLeft, markerTop);
