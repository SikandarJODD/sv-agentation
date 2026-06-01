import type { RectBox } from '../types';

export const INSPECTOR_UI_ATTRIBUTE = 'data-inspector-ui';
const DOM_PATH_SEPARATOR = '/';
// A segment with this prefix marks a descent through an open shadow root
// boundary (into `host.shadowRoot.children`) rather than a normal light-DOM child.
const SHADOW_SEGMENT_PREFIX = 's';

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

export const resolveInteractionHost = (target: Element | null) => {
	if (!(target instanceof HTMLElement)) return null;

	const host = target.closest(
		'[data-slot="dialog-content"], [role="dialog"], [role="alertdialog"]'
	);
	return host instanceof HTMLElement ? host : null;
};

export const toInteractionHostPoint = (left: number, top: number, host: HTMLElement | null) => {
	if (!host || !document.contains(host)) return { left, top };

	const rect = host.getBoundingClientRect();
	return {
		left: left - rect.left,
		top: top - rect.top
	};
};

export const toInteractionHostRect = (rect: RectBox, host: HTMLElement | null): RectBox => {
	if (!host || !document.contains(host)) return rect;

	const hostRect = host.getBoundingClientRect();
	return {
		left: rect.left - hostRect.left,
		top: rect.top - hostRect.top,
		width: rect.width,
		height: rect.height
	};
};

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

// Events that cross an open shadow boundary are retargeted: `event.target`
// becomes the shadow host, not the element actually under the pointer. The
// composed path keeps the real innermost target, so prefer it when available.
export const getDeepEventTarget = (event: Event): EventTarget | null => {
	if (typeof event.composedPath === 'function') {
		const path = event.composedPath();
		if (path.length > 0) return path[0];
	}
	return event.target;
};

export const buildDomPath = (target: Element) => {
	const segments: string[] = [];
	let current: Element | null = target;

	while (current && current !== document.body) {
		const parent: Element | null = current.parentElement;
		if (parent) {
			const index = Array.from(parent.children).indexOf(current);
			if (index < 0) return null;

			segments.unshift(String(index));
			current = parent;
			continue;
		}

		// No element parent: we may be sitting at the top of a shadow tree.
		// Cross into the host and record the boundary so it can be replayed.
		const root: Node | null = current.parentNode;
		if (root instanceof ShadowRoot) {
			const index = Array.from(root.children).indexOf(current);
			if (index < 0) return null;

			segments.unshift(`${SHADOW_SEGMENT_PREFIX}${index}`);
			current = root.host;
			continue;
		}

		return null;
	}

	return segments.join(DOM_PATH_SEPARATOR);
};

export const resolveDomPath = (domPath: string) => {
	if (typeof document === 'undefined') return null;
	if (!domPath) return document.body;

	let current: Element | null = document.body;
	const segments = domPath.split(DOM_PATH_SEPARATOR).filter((value) => value.length > 0);

	for (const segment of segments) {
		if (!current) return null;

		const isShadowSegment = segment.startsWith(SHADOW_SEGMENT_PREFIX);
		const raw = isShadowSegment ? segment.slice(SHADOW_SEGMENT_PREFIX.length) : segment;
		const index = Number.parseInt(raw, 10);
		if (!Number.isInteger(index) || index < 0) return null;

		current = isShadowSegment
			? (current.shadowRoot?.children.item(index) ?? null)
			: current.children.item(index);
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

// `querySelectorAll` does not pierce shadow roots, so collect matches from the
// document and recurse into every open shadow tree to mirror what the user can
// actually see and select on the page.
export const queryAllDeep = (selector: string): Element[] => {
	const results: Element[] = [];

	const visit = (root: Document | ShadowRoot) => {
		results.push(...Array.from(root.querySelectorAll(selector)));
		for (const element of root.querySelectorAll('*')) {
			if (element.shadowRoot) visit(element.shadowRoot);
		}
	};

	visit(document);
	return results;
};

// The element that should precede `element` in a selector chain. Crosses an
// open shadow boundary into the host so shadow-DOM elements get a full ancestor
// path instead of being treated as a root.
const getSelectorParentElement = (element: Element): Element | null => {
	if (element.parentElement) return element.parentElement;
	const root = element.parentNode;
	return root instanceof ShadowRoot ? root.host : null;
};

const toNthChildSuffix = (target: Element) => {
	// `parentNode` (not `parentElement`) so elements directly inside a shadow
	// root still resolve siblings against the shadow root's children.
	const container = target.parentNode;
	if (!(container instanceof Element || container instanceof ShadowRoot)) return '';

	const children = Array.from(container.children);
	const siblings = children.filter((sibling) => sibling.tagName === target.tagName);
	if (siblings.length <= 1) return '';

	const index = children.indexOf(target);
	return index >= 0 ? `:nth-child(${index + 1})` : '';
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
		current = getSelectorParentElement(current);
	}

	return segments.slice(-maxDepth).join(' > ') || buildElementSelectorSegment(target);
};

export const buildFullDomPath = (target: Element) => {
	const segments: string[] = [];
	let current: Element | null = target;

	while (current) {
		segments.unshift(buildElementSelectorSegment(current));
		current = getSelectorParentElement(current);
	}

	return segments.join(' > ');
};
