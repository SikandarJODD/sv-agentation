export const AGENTATION_BLOCKED_INTERACTION_EVENT = 'sv-agentation:blocked-interaction';
export const AGENTATION_ACTIVE_CHANGE_EVENT = 'sv-agentation:active-change';

export const COPY_OPEN_BLOCKED_INTERACTION_EVENT = 'copyopen:blocked-interaction';
export const COPY_OPEN_ACTIVE_CHANGE_EVENT = 'copyopen:active-change';

export const INSPECTOR_BLOCKED_INTERACTION_EVENT = AGENTATION_BLOCKED_INTERACTION_EVENT;
export const INSPECTOR_ACTIVE_CHANGE_EVENT = AGENTATION_ACTIVE_CHANGE_EVENT;

export interface InspectorBlockedInteractionDetail {
	source: 'click' | 'selection';
	target: Element;
}

export interface InspectorActiveChangeDetail {
	active: boolean;
}
