export const INSPECTOR_BLOCKED_INTERACTION_EVENT = 'copyopen:blocked-interaction';
export const INSPECTOR_ACTIVE_CHANGE_EVENT = 'copyopen:active-change';

export interface InspectorBlockedInteractionDetail {
	source: 'click' | 'selection';
	target: Element;
}

export interface InspectorActiveChangeDetail {
	active: boolean;
}
