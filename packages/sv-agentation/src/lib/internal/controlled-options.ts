export type ControlledInspectorOptionKey =
	| 'toolbarPosition'
	| 'outputMode'
	| 'pauseAnimations'
	| 'clearOnCopy'
	| 'includeComponentContext'
	| 'includeComputedStyles';

export type ControlledInspectorOptions = Record<ControlledInspectorOptionKey, boolean>;

export const DEFAULT_CONTROLLED_INSPECTOR_OPTIONS: ControlledInspectorOptions = {
	toolbarPosition: false,
	outputMode: false,
	pauseAnimations: false,
	clearOnCopy: false,
	includeComponentContext: false,
	includeComputedStyles: false
};
