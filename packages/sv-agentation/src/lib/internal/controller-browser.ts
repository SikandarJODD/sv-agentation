import type {
	InspectorActiveChangeDetail,
	InspectorBlockedInteractionDetail
} from '../events';
import {
	AGENTATION_ACTIVE_CHANGE_EVENT,
	AGENTATION_BLOCKED_INTERACTION_EVENT,
	COPY_OPEN_ACTIVE_CHANGE_EVENT,
	COPY_OPEN_BLOCKED_INTERACTION_EVENT
} from '../events';
import type { UserSelectSnapshot } from './controller-state.svelte';

const CURSOR_STYLE_ID = 'sv-agentation-cursor-styles';

const CURSOR_STYLE_TEXT = `
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

export const installInspectorCursorStyles = (currentStyle: HTMLStyleElement | null) => {
	if (currentStyle || typeof document === 'undefined') return currentStyle;

	const style = document.createElement('style');
	style.id = CURSOR_STYLE_ID;
	style.textContent = CURSOR_STYLE_TEXT;
	document.head.appendChild(style);
	return style;
};

export const removeInspectorCursorStyles = (currentStyle: HTMLStyleElement | null) => {
	currentStyle?.remove();
	return null;
};

export const dispatchBlockedInteraction = (
	target: Element,
	source: InspectorBlockedInteractionDetail['source']
) => {
	if (typeof window === 'undefined') return;

	for (const eventName of [
		AGENTATION_BLOCKED_INTERACTION_EVENT,
		COPY_OPEN_BLOCKED_INTERACTION_EVENT
	] as const) {
		window.dispatchEvent(
			new CustomEvent<InspectorBlockedInteractionDetail>(eventName, {
				detail: {
					source,
					target
				}
			})
		);
	}
};

export const dispatchInspectorActiveChange = (active: boolean) => {
	if (typeof window === 'undefined') return;

	for (const eventName of [
		AGENTATION_ACTIVE_CHANGE_EVENT,
		COPY_OPEN_ACTIVE_CHANGE_EVENT
	] as const) {
		window.dispatchEvent(
			new CustomEvent<InspectorActiveChangeDetail>(eventName, {
				detail: {
					active
				}
			})
		);
	}
};

export const setDragUserSelectSuppressed = (
	active: boolean,
	currentSnapshot: UserSelectSnapshot | null
) => {
	if (typeof document === 'undefined') return currentSnapshot;

	if (active) {
		if (currentSnapshot) return currentSnapshot;

		const nextSnapshot: UserSelectSnapshot = {
			bodyUserSelect: document.body.style.userSelect,
			bodyWebkitUserSelect: document.body.style.webkitUserSelect,
			documentUserSelect: document.documentElement.style.userSelect,
			documentWebkitUserSelect: document.documentElement.style.webkitUserSelect
		};

		document.body.style.userSelect = 'none';
		document.body.style.webkitUserSelect = 'none';
		document.documentElement.style.userSelect = 'none';
		document.documentElement.style.webkitUserSelect = 'none';
		return nextSnapshot;
	}

	if (!currentSnapshot) return null;

	document.body.style.userSelect = currentSnapshot.bodyUserSelect;
	document.body.style.webkitUserSelect = currentSnapshot.bodyWebkitUserSelect;
	document.documentElement.style.userSelect = currentSnapshot.documentUserSelect;
	document.documentElement.style.webkitUserSelect = currentSnapshot.documentWebkitUserSelect;
	return null;
};
