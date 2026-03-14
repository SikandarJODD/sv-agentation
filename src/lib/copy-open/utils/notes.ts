import type {
	InspectorNote,
	NotesSettings,
	RenderedInspectorNote,
	ResolvedNotePosition,
	ToolbarCoordinates
} from '../types';
import { clampNumber, getElementTextPreview, getTagLabel, resolveDomPath } from './dom';

const STORAGE_PREFIX = 'copy-open';
const TOOLBAR_POSITION_STORAGE_KEY = `${STORAGE_PREFIX}:toolbar-position:v1`;
const SETTINGS_STORAGE_KEY = `${STORAGE_PREFIX}:settings:v1`;
const NOTES_STORAGE_PREFIX = `${STORAGE_PREFIX}:notes:v1:`;

const TOOLBAR_MARGIN = 8;
export const COLLAPSED_TOOLBAR_SIZE = 52;
export const EXPANDED_TOOLBAR_WIDTH = 266;
export const EXPANDED_TOOLBAR_HEIGHT = 52;
const COMPOSER_WIDTH = 350;
const COMPOSER_HEIGHT = 186;
const PANEL_GAP = 14;

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
	blockPageInteractions: true,
	outputDetail: 'standard'
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

export const getPageStorageKey = () => {
	if (typeof window === 'undefined') return 'unknown-page';
	return `${window.location.origin}${window.location.pathname}${window.location.search}`;
};

export const buildNotesStorageKey = (pageStorageKey: string) =>
	`${NOTES_STORAGE_PREFIX}${encodeURIComponent(pageStorageKey)}`;

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
		x: clampNumber(position.x, TOOLBAR_MARGIN, Math.max(TOOLBAR_MARGIN, window.innerWidth - width - TOOLBAR_MARGIN)),
		y: clampNumber(position.y, TOOLBAR_MARGIN, Math.max(TOOLBAR_MARGIN, window.innerHeight - height - TOOLBAR_MARGIN))
	};
};

export const alignToolbarPositionForStateChange = (
	position: ToolbarCoordinates,
	fromExpanded: boolean,
	toExpanded: boolean
) => {
	const fromWidth = fromExpanded ? EXPANDED_TOOLBAR_WIDTH : COLLAPSED_TOOLBAR_SIZE;
	const fromHeight = fromExpanded ? EXPANDED_TOOLBAR_HEIGHT : COLLAPSED_TOOLBAR_SIZE;
	const toWidth = toExpanded ? EXPANDED_TOOLBAR_WIDTH : COLLAPSED_TOOLBAR_SIZE;
	const toHeight = toExpanded ? EXPANDED_TOOLBAR_HEIGHT : COLLAPSED_TOOLBAR_SIZE;

	return clampToolbarPosition(
		{
			x: position.x + (fromWidth - toWidth),
			y: position.y + (fromHeight - toHeight)
		},
		toExpanded,
		{
			width: toWidth,
			height: toHeight
		}
	);
};

export const readStoredToolbarPosition = () => {
	const storedPosition = readStoredJson<ToolbarCoordinates>(TOOLBAR_POSITION_STORAGE_KEY);
	if (!storedPosition) return createDefaultToolbarPosition();
	return clampToolbarPosition(storedPosition, false);
};

export const writeStoredToolbarPosition = (position: ToolbarCoordinates) => {
	writeStoredJson(TOOLBAR_POSITION_STORAGE_KEY, position);
};

export const readStoredSettings = () => {
	const storedSettings = readStoredJson<Partial<NotesSettings>>(SETTINGS_STORAGE_KEY);
	if (!storedSettings) return DEFAULT_NOTES_SETTINGS;

	return {
		markerColor:
			typeof storedSettings.markerColor === 'string'
				? storedSettings.markerColor
				: DEFAULT_NOTES_SETTINGS.markerColor,
		blockPageInteractions:
			typeof storedSettings.blockPageInteractions === 'boolean'
				? storedSettings.blockPageInteractions
				: DEFAULT_NOTES_SETTINGS.blockPageInteractions,
		outputDetail: DEFAULT_NOTES_SETTINGS.outputDetail
	} satisfies NotesSettings;
};

export const writeStoredSettings = (settings: NotesSettings) => {
	writeStoredJson(SETTINGS_STORAGE_KEY, settings);
};

export const readStoredNotes = (pageStorageKey: string) => {
	const storedNotes = readStoredJson<InspectorNote[]>(buildNotesStorageKey(pageStorageKey));
	if (!Array.isArray(storedNotes)) return [] as InspectorNote[];

	return storedNotes.filter(
		(note): note is InspectorNote =>
			typeof note?.id === 'string' &&
			typeof note?.note === 'string' &&
			typeof note?.targetSummary === 'string' &&
			typeof note?.color === 'string' &&
			typeof note?.anchor?.domPath === 'string'
	);
};

export const writeStoredNotes = (pageStorageKey: string, notes: InspectorNote[]) => {
	writeStoredJson(buildNotesStorageKey(pageStorageKey), notes);
};

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

export const resolveNotePosition = (note: InspectorNote): ResolvedNotePosition | null => {
	if (typeof window === 'undefined') return null;

	const target = resolveDomPath(note.anchor.domPath);
	if (!target) return null;

	const rect = target.getBoundingClientRect();
	const markerLeft = clampNumber(rect.left + rect.width * note.anchor.relativeX, 12, window.innerWidth - 12);
	const markerTop = clampNumber(rect.top + rect.height * note.anchor.relativeY, 12, window.innerHeight - 12);

	return {
		left: rect.left,
		top: rect.top,
		width: rect.width,
		height: rect.height,
		markerLeft,
		markerTop
	};
};

export const renderNote = (note: InspectorNote): RenderedInspectorNote => {
	const position = resolveNotePosition(note);

	return {
		...note,
		resolved: position !== null,
		position
	};
};

export const getComposerPosition = (markerLeft: number, markerTop: number) => {
	if (typeof window === 'undefined') {
		return {
			panelLeft: markerLeft,
			panelTop: markerTop + PANEL_GAP
		};
	}

	let panelLeft = markerLeft + 18;
	if (panelLeft + COMPOSER_WIDTH > window.innerWidth - 16) {
		panelLeft = markerLeft - COMPOSER_WIDTH + 18;
	}

	let panelTop = markerTop + 18;
	if (panelTop + COMPOSER_HEIGHT > window.innerHeight - 16) {
		panelTop = markerTop - COMPOSER_HEIGHT - PANEL_GAP;
	}

	return {
		panelLeft: clampNumber(panelLeft, 16, Math.max(16, window.innerWidth - COMPOSER_WIDTH - 16)),
		panelTop: clampNumber(panelTop, 16, Math.max(16, window.innerHeight - COMPOSER_HEIGHT - 16))
	};
};

export const formatLocation = (note: InspectorNote) => {
	if (!note.shortFileName) return 'Source unavailable';
	if (note.lineNumber === null || note.columnNumber === null) return note.shortFileName;

	return `${note.shortFileName}:${note.lineNumber}:${note.columnNumber}`;
};

const buildElementLocationPath = (note: InspectorNote) => {
	const target = resolveDomPath(note.anchor.domPath);
	if (!target) return note.tagName;

	const segments: string[] = [];
	let current: Element | null = target;

	while (current && current !== document.body) {
		segments.unshift(current.tagName.toLowerCase());
		current = current.parentElement;
	}

	return segments.slice(-4).join(' > ') || note.tagName;
};

export const formatNotesAsMarkdown = (notes: InspectorNote[]) => {
	if (notes.length === 0) {
		return 'Page Feedback\n\nNo feedback added yet.';
	}

	return [
		'Page Feedback',
		'',
		...notes.flatMap((note, index) =>
			[
				`${index + 1}. ${note.targetSummary}`,
				`Location: ${buildElementLocationPath(note)}`,
				`Feedback: ${note.note}`,
				`Source: ${formatLocation(note)}`,
				...(index < notes.length - 1 ? ['', '---', ''] : [])
			]
		)
	].join('\n');
};
