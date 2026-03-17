import { resolveElementInfo } from 'element-source';

import type {
	AgentationAnnotationSnapshot,
	AnnotationBoundingBox,
	AnnotationCapture,
	AnnotationComponentContext,
	AnnotationElementSnapshot,
	AnnotationPageSnapshot,
	AnnotationPosition,
	ComponentContextMode,
	ComputedStyleSnapshot,
	InspectorNote
} from '../types';
import {
	buildElementSelectorPath,
	buildFullDomPath,
	getElementClassNames,
	getElementTextPreview,
	resolveDomPath
} from './dom';
import { renderNote } from './note-rendering';
import { NO_SOURCE_VALUE } from './shared/constants';

const COMPUTED_STYLE_ALLOWLIST = [
	'color',
	'background-color',
	'font-size',
	'font-weight',
	'font-family',
	'line-height',
	'letter-spacing',
	'width',
	'height',
	'margin',
	'margin-top',
	'margin-right',
	'margin-bottom',
	'margin-left',
	'padding',
	'padding-top',
	'padding-right',
	'padding-bottom',
	'padding-left',
	'border',
	'border-radius',
	'display',
	'position',
	'top',
	'right',
	'bottom',
	'left',
	'flex',
	'flex-direction',
	'justify-content',
	'align-items',
	'gap',
	'grid-template-columns',
	'grid-template-rows',
	'opacity',
	'box-shadow',
	'transform'
] as const;

const collapseWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const truncateText = (value: string, maxLength = 140) => {
	if (value.length <= maxLength) return value;
	return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
};

const toFileStem = (filePath: string) => {
	const fileName = filePath.split('/').pop() ?? filePath;
	return fileName.replace(/\.[^.]+$/, '');
};

const normalizeComponentToken = (value: string) =>
	value
		.toLowerCase()
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

const normalizeClassToken = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

const buildComponentContext = (items: string[], classNames: string[]): AnnotationComponentContext => {
	const filtered = Array.from(new Set(items.filter((value) => value.trim().length > 0)));
	const classTokens = classNames
		.flatMap((name) => normalizeClassToken(name).split('-'))
		.filter((token) => token.length >= 3);
	const smart = filtered.filter((value) => {
		const token = normalizeComponentToken(value);
		return classTokens.some((classToken) => token.includes(classToken) || classToken.includes(token));
	});

	return {
		filtered,
		smart,
		all: filtered
	};
};

const resolveComponentName = (componentName: string | null | undefined, filePath: string | null | undefined) => {
	if (typeof componentName === 'string' && componentName.trim().length > 0) {
		return componentName.trim();
	}
	if (typeof filePath === 'string' && filePath !== NO_SOURCE_VALUE && filePath.trim().length > 0) {
		return toFileStem(filePath);
	}
	return null;
};

const getPageTitle = () => {
	if (typeof document === 'undefined') return '/';
	const pathname = window.location.pathname || '/';
	return pathname === '/' ? document.title || '/' : pathname;
};

const buildPageSnapshot = (timestamp: string): AnnotationPageSnapshot => ({
	title: getPageTitle(),
	pathname: typeof window === 'undefined' ? '/' : window.location.pathname || '/',
	url: typeof window === 'undefined' ? '' : window.location.href,
	viewport: {
		width: typeof window === 'undefined' ? 0 : window.innerWidth,
		height: typeof window === 'undefined' ? 0 : window.innerHeight
	},
	userAgent: typeof navigator === 'undefined' ? '' : navigator.userAgent,
	devicePixelRatio: typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1,
	timestamp
});

const buildAccessibilitySummary = (target: Element | null) => {
	if (!(target instanceof HTMLElement)) return null;

	const parts: string[] = [];
	const role = target.getAttribute('role');
	const ariaLabel = target.getAttribute('aria-label');
	const tabIndex = target.tabIndex;
	const isFocusable =
		tabIndex >= 0 ||
		target.matches(
			'button, a[href], input, select, textarea, summary, [contenteditable="true"], [role="button"]'
		);

	if (isFocusable) {
		parts.push('focusable');
	}
	if (role) {
		parts.push(`role ${role}`);
	}
	if (ariaLabel) {
		parts.push(`label "${ariaLabel}"`);
	}

	return parts.length > 0 ? parts.join(', ') : 'none';
};

const buildNearbyText = (target: Element | null) => {
	if (!target) return null;

	const containers = [
		target.parentElement,
		target.closest('button, a, label, form, article, section, main, nav, aside'),
		target.closest('[data-testid], [role], [aria-label]')
	].filter((value): value is Element => value instanceof Element);

	for (const container of containers) {
		const preview = truncateText(collapseWhitespace(getElementTextPreview(container)));
		if (preview) return preview;
	}

	const ownText = truncateText(collapseWhitespace(getElementTextPreview(target)));
	return ownText || null;
};

const buildBoundingBox = (note: InspectorNote): AnnotationBoundingBox | null => {
	const rendered = renderNote(note);
	const bounds = rendered.position?.bounds;
	if (!bounds) return null;

	return {
		x: Math.round(bounds.left),
		y: Math.round(bounds.top),
		width: Math.round(bounds.width),
		height: Math.round(bounds.height)
	};
};

const buildAnnotationPosition = (note: InspectorNote): AnnotationPosition | null => {
	const rendered = renderNote(note);
	const position = rendered.position;
	if (!position) return null;

	const viewportWidth = typeof window === 'undefined' ? 1 : Math.max(1, window.innerWidth);
	return {
		x: Math.round(position.markerLeft),
		y: Math.round(position.markerTop),
		xPercent: Number(((position.markerLeft / viewportWidth) * 100).toFixed(1)),
		yAbsolute: Math.round(position.markerTop)
	};
};

const buildComputedStyles = (target: Element | null): ComputedStyleSnapshot | null => {
	if (!(target instanceof HTMLElement)) return null;

	const styles = window.getComputedStyle(target);
	const snapshot: ComputedStyleSnapshot = {};

	for (const propertyName of COMPUTED_STYLE_ALLOWLIST) {
		const value = styles.getPropertyValue(propertyName).trim();
		if (value) {
			snapshot[propertyName] = value;
		}
	}

	return Object.keys(snapshot).length > 0 ? snapshot : null;
};

const resolvePrimaryElement = (note: InspectorNote) => {
	switch (note.kind) {
		case 'element':
			return resolveDomPath(note.anchor.domPath);
		case 'text':
			return resolveDomPath(note.anchor.commonAncestorPath);
		case 'group':
			return (
				resolveDomPath(note.anchor.anchorDomPath) ??
				resolveDomPath(note.anchor.selectedDomPaths[0] ?? '')
			);
		case 'area':
			return null;
	}
};

const collectComponentChain = async (target: Element | null, classNames: string[]) => {
	if (!target) {
		return {
			filtered: [],
			smart: [],
			all: []
		} satisfies AnnotationComponentContext;
	}

	const components: string[] = [];
	let current: Element | null = target;

	while (current) {
		try {
			const info = await resolveElementInfo(current);
			const sourcePath = info.source?.filePath ?? null;
			const component = resolveComponentName(info.componentName, sourcePath);
			if (component && sourcePath !== NO_SOURCE_VALUE) {
				components.unshift(component);
			}
		} catch {
			// Keep walking even if one ancestor is missing source metadata.
		}
		current = current.parentElement;
	}

	return buildComponentContext(components, classNames);
};

const buildElementSnapshot = async (note: InspectorNote): Promise<AnnotationElementSnapshot> => {
	const target = resolvePrimaryElement(note);
	const classNames = target ? getElementClassNames(target) : [];

	return {
		selector: target ? buildElementSelectorPath(target) : null,
		fullDomPath: target ? buildFullDomPath(target) : null,
		cssClasses: classNames,
		components: await collectComponentChain(target, classNames),
		boundingBox: buildBoundingBox(note),
		position: buildAnnotationPosition(note),
		selectedText: note.kind === 'text' ? note.anchor.selectedText : null,
		nearbyText: buildNearbyText(target),
		accessibility: buildAccessibilitySummary(target),
		computedStyles: buildComputedStyles(target)
	};
};

export const captureAnnotationContext = async (
	note: InspectorNote,
	timestamp = new Date().toISOString()
): Promise<AnnotationCapture> => ({
	page: buildPageSnapshot(timestamp),
	element: await buildElementSnapshot(note)
});

const buildComponentSnapshotForMode = (
	components: AnnotationComponentContext,
	mode: ComponentContextMode,
	enabled: boolean
) => {
	if (!enabled) {
		return {
			filtered: [],
			smart: [],
			all: []
		};
	}

	switch (mode) {
		case 'filtered':
			return {
				filtered: components.filtered,
				smart: [],
				all: []
			};
		case 'smart':
			return {
				filtered: [],
				smart: components.smart,
				all: []
			};
		case 'all':
			return {
				filtered: [],
				smart: [],
				all: components.all
			};
	}
};

export const buildAnnotationSnapshot = (
	note: InspectorNote,
	capture: AnnotationCapture
): AgentationAnnotationSnapshot => ({
	id: note.id,
	kind: note.kind,
	comment: note.note,
	targetSummary: note.targetSummary,
	targetLabel: note.targetLabel,
	elementPath: capture.element.selector ?? capture.element.fullDomPath,
	timestamp: capture.page.timestamp,
	page: capture.page,
	element: capture.element,
	source: {
		componentName: note.componentName,
		tagName: note.tagName,
		filePath: note.filePath,
		shortFileName: note.shortFileName,
		lineNumber: note.lineNumber,
		columnNumber: note.columnNumber
	}
});

export const filterAnnotationSnapshotForMode = (
	snapshot: AgentationAnnotationSnapshot,
	options: {
		outputMode: 'compact' | 'standard' | 'detailed' | 'forensic';
		includeComponentContext: boolean;
		includeComputedStyles: boolean;
	}
): AgentationAnnotationSnapshot => {
	const compactBase = {
		...snapshot,
		element: {
			...snapshot.element,
			selector: null,
			fullDomPath: null,
			components: buildComponentSnapshotForMode(snapshot.element.components, 'filtered', false),
			boundingBox: null,
			position: null,
			nearbyText: null,
			accessibility: null,
			computedStyles: null
		}
	};

	if (options.outputMode === 'compact') {
		return compactBase;
	}

	if (options.outputMode === 'standard') {
		return {
			...snapshot,
			element: {
				...snapshot.element,
				fullDomPath: null,
				components: buildComponentSnapshotForMode(
					snapshot.element.components,
					'filtered',
					options.includeComponentContext
				),
				nearbyText: null,
				accessibility: null,
				computedStyles: null
			}
		};
	}

	if (options.outputMode === 'detailed') {
		return {
			...snapshot,
			element: {
				...snapshot.element,
				fullDomPath: null,
				components: buildComponentSnapshotForMode(
					snapshot.element.components,
					'smart',
					options.includeComponentContext
				),
				accessibility: null,
				computedStyles: null
			}
		};
	}

	return {
		...snapshot,
		element: {
			...snapshot.element,
			components: buildComponentSnapshotForMode(
				snapshot.element.components,
				'all',
				options.includeComponentContext
			),
			computedStyles: options.includeComputedStyles ? snapshot.element.computedStyles : null
		}
	};
};
