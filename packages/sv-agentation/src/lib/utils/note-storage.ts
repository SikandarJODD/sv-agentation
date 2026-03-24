import type {
	AnnotationCapture,
	InspectorNote,
	NoteSourceInfo,
	NotesSettings,
	OutputMode,
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

const SETTINGS_STORAGE_KEY = `${STORAGE_PREFIX}:settings:v2`;
const NOTES_STORAGE_PREFIX = `${STORAGE_PREFIX}:notes:v1:`;
const TOOLBAR_STORAGE_PREFIX = `${STORAGE_PREFIX}:toolbar:v1:`;

const OUTPUT_MODES: OutputMode[] = ['compact', 'standard', 'detailed', 'forensic'];
type PersistedSettings = Pick<
	NotesSettings,
	| 'blockPageInteractions'
	| 'outputMode'
	| 'pauseAnimations'
	| 'clearOnCopy'
	| 'includeComponentContext'
	| 'includeComputedStyles'
>;

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

export const normalizePageSessionKey = (pageSessionKey?: string | null) => {
	if (typeof pageSessionKey === 'string') {
		const trimmedKey = pageSessionKey.trim();
		if (!trimmedKey || trimmedKey === '/') return '/';

		const [withoutHash] = trimmedKey.split('#');
		const [pathname] = withoutHash.split('?');
		if (!pathname || pathname === '/') return '/';

		return pathname.startsWith('/') ? pathname : `/${pathname}`;
	}

	if (typeof window === 'undefined') return 'unknown-page';
	return window.location.pathname || '/';
};

export const getPageStorageKey = (pageSessionKey?: string | null) =>
	normalizePageSessionKey(pageSessionKey);

export const getLegacyPageStorageKey = (pageSessionKey?: string | null) => {
	if (typeof window === 'undefined') return null;

	const normalizedPageKey = normalizePageSessionKey(pageSessionKey);
	const currentPageKey = normalizePageSessionKey(window.location.pathname);
	if (normalizedPageKey !== currentPageKey) return null;

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

export const readStoredSettings = (defaults: NotesSettings = DEFAULT_NOTES_SETTINGS) => {
	const storedSettings = readStoredJson<Partial<PersistedSettings>>(SETTINGS_STORAGE_KEY);
	if (!storedSettings) return defaults;

	return {
		markerColor: defaults.markerColor,
		themeMode: defaults.themeMode,
		blockPageInteractions:
			typeof storedSettings.blockPageInteractions === 'boolean'
				? storedSettings.blockPageInteractions
				: defaults.blockPageInteractions,
		outputMode: OUTPUT_MODES.includes(storedSettings.outputMode as OutputMode)
			? (storedSettings.outputMode as OutputMode)
			: defaults.outputMode,
		pauseAnimations:
			typeof storedSettings.pauseAnimations === 'boolean'
				? storedSettings.pauseAnimations
				: defaults.pauseAnimations,
		clearOnCopy:
			typeof storedSettings.clearOnCopy === 'boolean'
				? storedSettings.clearOnCopy
				: defaults.clearOnCopy,
		includeComponentContext:
			typeof storedSettings.includeComponentContext === 'boolean'
				? storedSettings.includeComponentContext
				: defaults.includeComponentContext,
		includeComputedStyles:
			typeof storedSettings.includeComputedStyles === 'boolean'
				? storedSettings.includeComputedStyles
				: defaults.includeComputedStyles
	} satisfies NotesSettings;
};

export const writeStoredSettings = (
	settings: NotesSettings,
	options?: {
		skipKeys?: (keyof PersistedSettings)[];
	}
) => {
	const skipKeys = new Set(options?.skipKeys ?? []);
	const storedSettings = readStoredJson<Partial<PersistedSettings>>(SETTINGS_STORAGE_KEY) ?? {};
	writeStoredJson(SETTINGS_STORAGE_KEY, {
		blockPageInteractions: skipKeys.has('blockPageInteractions')
			? storedSettings.blockPageInteractions
			: settings.blockPageInteractions,
		outputMode: skipKeys.has('outputMode') ? storedSettings.outputMode : settings.outputMode,
		pauseAnimations: skipKeys.has('pauseAnimations')
			? storedSettings.pauseAnimations
			: settings.pauseAnimations,
		clearOnCopy: skipKeys.has('clearOnCopy') ? storedSettings.clearOnCopy : settings.clearOnCopy,
		includeComponentContext: skipKeys.has('includeComponentContext')
			? storedSettings.includeComponentContext
			: settings.includeComponentContext,
		includeComputedStyles: skipKeys.has('includeComputedStyles')
			? storedSettings.includeComputedStyles
			: settings.includeComputedStyles
	} satisfies Partial<PersistedSettings>);
};

const isAnnotationCapture = (value: unknown): value is AnnotationCapture => {
	if (!value || typeof value !== 'object') return false;

	const candidate = value as Partial<AnnotationCapture>;
	return (
		typeof candidate.page?.title === 'string' &&
		typeof candidate.page?.url === 'string' &&
		typeof candidate.page?.timestamp === 'string' &&
		typeof candidate.element === 'object'
	);
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

	if ('capture' in candidate && candidate.capture !== undefined && !isAnnotationCapture(candidate.capture)) {
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

const filterValidNotes = (storedNotes: unknown) =>
	Array.isArray(storedNotes)
		? storedNotes.filter((value): value is InspectorNote => isValidNote(value))
		: ([] as InspectorNote[]);

export const readStoredNotes = (pageStorageKey: string, legacyPageStorageKey?: string | null) => {
	const storageKey = buildNotesStorageKey(pageStorageKey);
	const nextNotes = filterValidNotes(readStoredJson<unknown[]>(storageKey));
	if (nextNotes.length > 0) return nextNotes;

	const fallbackLegacyPageStorageKey =
		legacyPageStorageKey === undefined ? getLegacyPageStorageKey(pageStorageKey) : legacyPageStorageKey;
	if (!fallbackLegacyPageStorageKey) return nextNotes;

	// Keep old route-specific notes alive once, then move them to the pathname session.
	const legacyNotes = filterValidNotes(
		readStoredJson<unknown[]>(buildNotesStorageKey(fallbackLegacyPageStorageKey))
	);
	if (legacyNotes.length === 0) return nextNotes;

	writeStoredJson(storageKey, legacyNotes);
	return legacyNotes;
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
