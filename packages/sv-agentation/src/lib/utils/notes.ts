export {
	alignToolbarPositionForStateChange,
	buildAreaComposerVisuals,
	buildGroupSelectionFromRects,
	buildMarkerOutlineVars,
	clampToolbarPosition,
	CLAMPED_TOOLBAR_MARGIN,
	COLLAPSED_TOOLBAR_SIZE,
	COMPOSER_HEIGHT,
	COMPOSER_WIDTH,
	createAreaAnchorFromBounds,
	createDefaultToolbarPosition,
	createGroupAnchorFromElements,
	DEFAULT_DELETE_ALL_DELAY_MS,
	DEFAULT_MARKER_COLORS,
	DEFAULT_NOTES_SETTINGS,
	EXPANDED_TOOLBAR_HEIGHT,
	EXPANDED_TOOLBAR_WIDTH,
	GROUP_SELECTION_COLOR
} from './note-layout';
export {
	buildAreaTargetLabel,
	buildAreaTargetSummary,
	buildElementTargetLabel,
	buildElementTargetSummary,
	buildGroupTargetLabel,
	buildGroupTargetSummary,
	buildSourceInfoFromHoverInfo,
	buildTextTargetLabel,
	buildTextTargetSummary,
	createEmptySourceInfo,
	formatLocation,
	formatNotesAsMarkdown,
	getComposerPlaceholder,
	truncateText
} from './note-formatting';
export { buildComposerState, renderNote } from './note-rendering';
export {
	buildNotesStorageKey,
	getPageStorageKey,
	isNoteSourceInfo,
	readStoredMarkerColor,
	readStoredNotes,
	readStoredSettings,
	readStoredThemeMode,
	sanitizeDeleteAllDelayMs,
	writeStoredMarkerColor,
	writeStoredNotes,
	writeStoredSettings,
	writeStoredThemeMode
} from './note-storage';
export { NO_SOURCE_VALUE } from './shared/constants';
