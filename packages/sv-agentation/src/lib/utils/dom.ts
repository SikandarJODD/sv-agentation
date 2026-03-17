export const INSPECTOR_UI_ATTRIBUTE = 'data-inspector-ui';
const DOM_PATH_SEPARATOR = '/';

const TEXT_CURSOR_SELECTOR = [
	'p',
	'span',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'li',
	'td',
	'th',
	'label',
	'blockquote',
	'figcaption',
	'caption',
	'legend',
	'dt',
	'dd',
	'pre',
	'code',
	'em',
	'strong',
	'b',
	'i',
	'u',
	's',
	'a',
	'time',
	'address',
	'cite',
	'q',
	'abbr',
	'dfn',
	'[contenteditable]'
].join(',');

const INTERACTIVE_SELECTOR = "button, a, input, select, textarea, [role='button'], [onclick]";

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

export const resolveElementFromNode = (node: Node | null) => {
	if (!node) return null;
	if (node instanceof Element) return node;
	return node.parentElement;
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

export const isInteractiveElement = (target: Element) =>
	target.closest(INTERACTIVE_SELECTOR) !== null;

export const isTextCursorElement = (target: Element) =>
	target.closest(TEXT_CURSOR_SELECTOR) !== null;

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

export const getElementClassNames = (target: Element) =>
	Array.from(target.classList).filter((value) => value.trim().length > 0);

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

export const getDeepElementFromPoint = (x: number, y: number) => {
	let element = document.elementFromPoint(x, y);
	if (!(element instanceof HTMLElement)) return null;

	while (element.shadowRoot) {
		const deeper = element.shadowRoot.elementFromPoint(x, y);
		if (!(deeper instanceof HTMLElement) || deeper === element) {
			break;
		}
		element = deeper;
	}

	return element;
};

const toNthChildSuffix = (target: Element) => {
	if (!target.parentElement) return '';

	const siblings = Array.from(target.parentElement.children).filter(
		(sibling) => sibling.tagName === target.tagName
	);
	if (siblings.length <= 1) return '';

	const index = siblings.indexOf(target);
	return index >= 0 ? `:nth-child(${Array.from(target.parentElement.children).indexOf(target) + 1})` : '';
};

export const buildElementSelectorSegment = (target: Element) => {
	const classNames = getElementClassNames(target);
	if (classNames.length > 0) {
		return `${target.tagName.toLowerCase()}.${classNames[0]}`;
	}

	return `${target.tagName.toLowerCase()}${toNthChildSuffix(target)}`;
};

export const buildElementSelectorPath = (target: Element, maxDepth = 4) => {
	const segments: string[] = [];
	let current: Element | null = target;

	while (current && current !== document.body) {
		segments.unshift(buildElementSelectorSegment(current));
		current = current.parentElement;
	}

	return segments.slice(-maxDepth).join(' > ') || buildElementSelectorSegment(target);
};

export const buildFullDomPath = (target: Element) => {
	const segments: string[] = [];
	let current: Element | null = target;

	while (current) {
		segments.unshift(buildElementSelectorSegment(current));
		current = current.parentElement;
	}

	return segments.join(' > ');
};
