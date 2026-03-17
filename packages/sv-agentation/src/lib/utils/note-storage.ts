import type {
	InspectorNote,
	NoteSourceInfo,
	NotesSettings,
	ThemeMode,
	ToolbarCoordinates
} from '../types';
import {
	DEFAULT_DELETE_ALL_DELAY_MS,
	DEFAULT_MARKER_COLORS,
	DEFAULT_NOTES_SETTINGS
} from './note-layout';
import {
	MARKER_COLOR_STORAGE_KEY,
	STORAGE_PREFIX,
	THEME_MODE_STORAGE_KEY
} from './shared/constants';
import { readStoredJson, writeStoredJson } from './shared/storage';

const SETTINGS_STORAGE_KEY = `${STORAGE_PREFIX}:settings:v1`;
const NOTES_STORAGE_PREFIX = `${STORAGE_PREFIX}:notes:v1:`;
const TOOLBAR_STORAGE_PREFIX = `${STORAGE_PREFIX}:toolbar:v1:`;

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

export const getPageStorageKey = () => {
	if (typeof window === 'undefined') return 'unknown-page';
	return `${window.location.origin}${window.location.pathname}${window.location.search}`;
};

export const buildNotesStorageKey = (pageStorageKey: string) =>
	`${NOTES_STORAGE_PREFIX}${encodeURIComponent(pageStorageKey)}`;

export const buildToolbarStorageKey = (pageStorageKey: string) =>
	`${TOOLBAR_STORAGE_PREFIX}${encodeURIComponent(pageStorageKey)}`;

export const sanitizeDeleteAllDelayMs = (value: number | null | undefined) =>
	typeof value === 'number' && Number.isFinite(value) && value > 0
		? value
		: DEFAULT_DELETE_ALL_DELAY_MS;

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

export const readStoredSettings = () => {
	const storedSettings = readStoredJson<Partial<NotesSettings>>(SETTINGS_STORAGE_KEY);
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

export const writeStoredSettings = (settings: NotesSettings) => {
	writeStoredJson(SETTINGS_STORAGE_KEY, {
		blockPageInteractions: settings.blockPageInteractions,
		outputDetail: settings.outputDetail
	});
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
			return typeof candidate.anchor?.domPath === 'string';
		case 'text':
			return typeof candidate.anchor?.commonAncestorPath === 'string';
		case 'group':
			return Array.isArray(candidate.anchor?.selectedDomPaths);
		case 'area':
			return typeof candidate.anchor?.bounds?.left === 'number';
		default:
			return false;
	}
};

export const readStoredNotes = (pageStorageKey: string) => {
	const storedNotes = readStoredJson<unknown[]>(buildNotesStorageKey(pageStorageKey));
	if (!Array.isArray(storedNotes)) return [] as InspectorNote[];

	return storedNotes.filter((value): value is InspectorNote => isValidNote(value));
};

export const writeStoredNotes = (pageStorageKey: string, notes: InspectorNote[]) => {
	writeStoredJson(buildNotesStorageKey(pageStorageKey), notes);
};

export const isNoteSourceInfo = (value: unknown): value is NoteSourceInfo => {
	if (!value || typeof value !== 'object') return false;
	const candidate = value as Partial<NoteSourceInfo>;
	return (
		typeof candidate.tagName === 'string' &&
		typeof candidate.filePath === 'string' &&
		typeof candidate.shortFileName === 'string'
	);
};
