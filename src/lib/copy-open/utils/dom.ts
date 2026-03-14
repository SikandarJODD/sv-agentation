export const INSPECTOR_UI_ATTRIBUTE = 'data-inspector-ui';

export const isElementTarget = (target: EventTarget | null): target is Element =>
	typeof Element !== 'undefined' && target instanceof Element;

export const isTypingTarget = (target: EventTarget | null) => {
	if (!(target instanceof HTMLElement)) return false;
	const tagName = target.tagName.toLowerCase();
	if (target.isContentEditable) return true;
	return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
};

export const isInspectorUiTarget = (target: Element) =>
	target.closest(`[${INSPECTOR_UI_ATTRIBUTE}]`) !== null;

export const matchesSelectorScope = (target: Element, selector: string | null) => {
	if (!selector) return true;

	try {
		return target.closest(selector) !== null;
	} catch {
		return false;
	}
};

export const resolveInspectableTarget = (target: EventTarget | null, selector: string | null) => {
	if (!isElementTarget(target)) return null;
	if (isInspectorUiTarget(target)) return null;
	if (!matchesSelectorScope(target, selector)) return null;
	return target;
};
