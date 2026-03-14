export const INSPECTOR_UI_ATTRIBUTE = 'data-inspector-ui';
const DOM_PATH_SEPARATOR = '/';

export const isElementTarget = (target: EventTarget | null): target is Element =>
	typeof Element !== 'undefined' && target instanceof Element;

export const clampNumber = (value: number, min: number, max: number) =>
	Math.min(Math.max(value, min), max);

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

export const buildDomPath = (target: Element) => {
	const segments: number[] = [];
	let current: Element | null = target;

	while (current && current !== document.body) {
		const parent: Element | null = current.parentElement;
		if (!parent) return null;

		const index = Array.from(parent.children).indexOf(current);
		if (index < 0) return null;

		segments.unshift(index);
		current = parent;
	}

	return segments.join(DOM_PATH_SEPARATOR);
};

export const resolveDomPath = (domPath: string) => {
	if (typeof document === 'undefined') return null;
	if (!domPath) return document.body;

	let current: Element | null = document.body;
	const segments = domPath
		.split(DOM_PATH_SEPARATOR)
		.map((value) => Number.parseInt(value, 10))
		.filter((value) => Number.isInteger(value) && value >= 0);

	for (const segment of segments) {
		if (!current) return null;
		current = current.children.item(segment);
	}

	return current;
};

export const getElementTextPreview = (target: Element) =>
	target.textContent?.replace(/\s+/g, ' ').trim() ?? '';

export const getTagLabel = (tagName: string) => {
	const normalized = tagName.toLowerCase();

	switch (normalized) {
		case 'p':
			return 'paragraph';
		case 'li':
			return 'list item';
		case 'ul':
		case 'ol':
			return 'list';
		case 'a':
			return 'link';
		case 'img':
			return 'image';
		case 'h1':
		case 'h2':
		case 'h3':
		case 'h4':
		case 'h5':
		case 'h6':
			return 'heading';
		default:
			return normalized;
	}
};
