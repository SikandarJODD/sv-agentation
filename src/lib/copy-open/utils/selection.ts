import type {
	AbsoluteRectBox,
	AreaSelectionAnchor,
	GroupSelectionAnchor,
	NoteMarkerFallback,
	RectBox,
	TextSelectionAnchor
} from '../types';
import { buildDomPath, clampNumber, resolveDomPath } from './dom';

const SELECTION_CONTEXT_LENGTH = 32;
const MARKER_GUTTER = 12;

export interface ResolvedTextSelection {
	range: Range;
	rects: RectBox[];
	bounds: RectBox | null;
	markerLeft: number;
	markerTop: number;
}

export interface ResolvedGroupSelection {
	rects: RectBox[];
	bounds: RectBox | null;
	markerLeft: number;
	markerTop: number;
	resolvedCount: number;
}

const normalizeSelectionText = (value: string) => value.replace(/\s+/g, ' ').trim();

const rectToBox = (rect: DOMRect): RectBox => ({
	left: rect.left,
	top: rect.top,
	width: rect.width,
	height: rect.height
});

export const getRangeRects = (range: Range) =>
	Array.from(range.getClientRects())
		.filter((rect) => rect.width > 0 || rect.height > 0)
		.map(rectToBox);

export const getBoundsFromRects = (rects: RectBox[]): RectBox | null => {
	if (rects.length === 0) return null;

	const left = Math.min(...rects.map((rect) => rect.left));
	const top = Math.min(...rects.map((rect) => rect.top));
	const right = Math.max(...rects.map((rect) => rect.left + rect.width));
	const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));

	return {
		left,
		top,
		width: right - left,
		height: bottom - top
	};
};

export const getMarkerFromRects = (rects: RectBox[], fallbackBounds: RectBox | null) => {
	const lastRect = rects.at(-1) ?? fallbackBounds;
	const markerLeft = clampNumber(
		(lastRect?.left ?? window.innerWidth / 2) + (lastRect?.width ?? 0),
		MARKER_GUTTER,
		window.innerWidth - MARKER_GUTTER
	);
	const markerTop = clampNumber(
		(lastRect?.top ?? window.innerHeight / 2) + (lastRect?.height ?? 0),
		MARKER_GUTTER,
		window.innerHeight - MARKER_GUTTER
	);

	return {
		markerLeft,
		markerTop
	};
};

const toFallbackMarker = (markerLeft: number, markerTop: number): NoteMarkerFallback => ({
	xPercent: window.innerWidth > 0 ? (markerLeft / window.innerWidth) * 100 : 50,
	yAbsolute: markerTop + window.scrollY
});

export const markerFromFallback = (fallback: NoteMarkerFallback) => ({
	markerLeft: clampNumber((fallback.xPercent / 100) * window.innerWidth, MARKER_GUTTER, window.innerWidth - MARKER_GUTTER),
	markerTop: clampNumber(fallback.yAbsolute - window.scrollY, MARKER_GUTTER, window.innerHeight - MARKER_GUTTER)
});

const getOffsetWithinAncestor = (ancestor: Element, container: Node, offset: number) => {
	const range = document.createRange();
	range.selectNodeContents(ancestor);
	range.setEnd(container, offset);
	return range.toString().length;
};

const resolveBoundaryFromOffset = (ancestor: Element, targetOffset: number) => {
	const walker = document.createTreeWalker(ancestor, NodeFilter.SHOW_TEXT);
	let textNode = walker.nextNode();
	let consumed = 0;
	let lastTextNode: Text | null = null;

	while (textNode) {
		if (textNode instanceof Text) {
			const nextConsumed = consumed + textNode.data.length;
			lastTextNode = textNode;
			if (targetOffset <= nextConsumed) {
				return {
					node: textNode,
					offset: Math.max(0, targetOffset - consumed)
				};
			}
			consumed = nextConsumed;
		}
		textNode = walker.nextNode();
	}

	if (lastTextNode) {
		return {
			node: lastTextNode,
			offset: lastTextNode.data.length
		};
	}

	return {
		node: ancestor,
		offset: ancestor.childNodes.length
	};
};

const createRangeFromOffsets = (ancestor: Element, startOffset: number, endOffset: number) => {
	const start = resolveBoundaryFromOffset(ancestor, startOffset);
	const end = resolveBoundaryFromOffset(ancestor, endOffset);
	const range = document.createRange();
	range.setStart(start.node, start.offset);
	range.setEnd(end.node, end.offset);
	return range;
};

const buildRangeFromTextMatch = (ancestor: Element, startOffset: number, text: string) => {
	const range = createRangeFromOffsets(ancestor, startOffset, startOffset + text.length);
	if (range.toString() === text) return range;
	if (normalizeSelectionText(range.toString()) === normalizeSelectionText(text)) return range;
	return null;
};

const findMatchingOffsets = (anchor: TextSelectionAnchor, fullText: string) => {
	const normalizedSelected = normalizeSelectionText(anchor.selectedText);
	if (!normalizedSelected) return null;

	const candidates: number[] = [];
	let searchIndex = 0;
	while (searchIndex < fullText.length) {
		const foundIndex = fullText.indexOf(anchor.selectedText, searchIndex);
		if (foundIndex < 0) break;
		candidates.push(foundIndex);
		searchIndex = foundIndex + Math.max(1, anchor.selectedText.length);
	}

	for (const startOffset of candidates) {
		const before = fullText.slice(
			Math.max(0, startOffset - anchor.contextBefore.length),
			startOffset
		);
		const endOffset = startOffset + anchor.selectedText.length;
		const after = fullText.slice(endOffset, endOffset + anchor.contextAfter.length);
		if (anchor.contextBefore && before !== anchor.contextBefore) continue;
		if (anchor.contextAfter && after !== anchor.contextAfter) continue;
		return {
			startOffset,
			endOffset
		};
	}

	const normalizedFull = normalizeSelectionText(fullText);
	const normalizedIndex = normalizedFull.indexOf(normalizedSelected);
	if (normalizedIndex < 0) return null;

	return {
		startOffset: anchor.startOffset,
		endOffset: anchor.endOffset
	};
};

export const serializeTextSelection = (selection: Selection) => {
	if (selection.rangeCount === 0 || selection.isCollapsed) return null;

	const range = selection.getRangeAt(0).cloneRange();
	if (range.collapsed) return null;

	const commonAncestor =
		range.commonAncestorContainer instanceof Element
			? range.commonAncestorContainer
			: range.commonAncestorContainer.parentElement;
	if (!commonAncestor) return null;

	const commonAncestorPath = buildDomPath(commonAncestor);
	if (commonAncestorPath === null) return null;

	const rects = getRangeRects(range);
	if (rects.length === 0) return null;

	const selectedText = range.toString();
	if (!normalizeSelectionText(selectedText)) return null;

	const startOffset = getOffsetWithinAncestor(commonAncestor, range.startContainer, range.startOffset);
	const endOffset = getOffsetWithinAncestor(commonAncestor, range.endContainer, range.endOffset);
	const fullText = commonAncestor.textContent ?? '';
	const contextBefore = fullText.slice(Math.max(0, startOffset - SELECTION_CONTEXT_LENGTH), startOffset);
	const contextAfter = fullText.slice(endOffset, endOffset + SELECTION_CONTEXT_LENGTH);
	const bounds = getBoundsFromRects(rects);
	const { markerLeft, markerTop } = getMarkerFromRects(rects, bounds);

	return {
		anchor: {
			commonAncestorPath,
			selectedText,
			contextBefore,
			contextAfter,
			startOffset,
			endOffset,
			fallbackMarker: toFallbackMarker(markerLeft, markerTop)
		} satisfies TextSelectionAnchor,
		rects,
		bounds,
		markerLeft,
		markerTop,
		commonAncestor
	};
};

export const resolveTextSelection = (anchor: TextSelectionAnchor): ResolvedTextSelection | null => {
	const ancestor = resolveDomPath(anchor.commonAncestorPath);
	if (!ancestor) return null;

	let range = buildRangeFromTextMatch(ancestor, anchor.startOffset, anchor.selectedText);
	if (!range) {
		const fullText = ancestor.textContent ?? '';
		const matchedOffsets = findMatchingOffsets(anchor, fullText);
		if (matchedOffsets) {
			range = buildRangeFromTextMatch(ancestor, matchedOffsets.startOffset, anchor.selectedText);
		}
	}

	if (!range) return null;

	const rects = getRangeRects(range);
	if (rects.length === 0) return null;
	const bounds = getBoundsFromRects(rects);
	const { markerLeft, markerTop } = getMarkerFromRects(rects, bounds);

	return {
		range,
		rects,
		bounds,
		markerLeft,
		markerTop
	};
};

const absoluteToViewportRect = (rect: AbsoluteRectBox): RectBox => ({
	left: rect.left,
	top: rect.top - window.scrollY,
	width: rect.width,
	height: rect.height
});

const toAbsoluteRect = (rect: RectBox): AbsoluteRectBox => ({
	left: rect.left,
	top: rect.top + window.scrollY,
	width: rect.width,
	height: rect.height
});

export const buildGroupSelectionAnchor = (
	elements: Element[],
	anchorElement: Element,
	markerLeft: number,
	markerTop: number
) => {
	const selectedDomPaths = elements
		.map((element) => buildDomPath(element))
		.filter((value): value is string => value !== null);
	const anchorDomPath = buildDomPath(anchorElement);
	if (!anchorDomPath || selectedDomPaths.length === 0) return null;

	const rects = elements.map((element) => rectToBox(element.getBoundingClientRect()));
	const bounds = getBoundsFromRects(rects);
	if (!bounds) return null;

	return {
		anchor: {
			selectedDomPaths,
			anchorDomPath,
			bounds: toAbsoluteRect(bounds),
			fallbackMarker: toFallbackMarker(markerLeft, markerTop)
		} satisfies GroupSelectionAnchor,
		rects,
		bounds,
		markerLeft,
		markerTop
	};
};

export const resolveGroupSelection = (anchor: GroupSelectionAnchor): ResolvedGroupSelection | null => {
	const resolvedElements = anchor.selectedDomPaths
		.map((path) => resolveDomPath(path))
		.filter((value): value is Element => value !== null);

	if (resolvedElements.length === 0) return null;

	const rects = resolvedElements
		.map((element) => rectToBox(element.getBoundingClientRect()))
		.filter((rect) => rect.width > 0 || rect.height > 0);
	const bounds = getBoundsFromRects(rects);
	const anchorElement = resolveDomPath(anchor.anchorDomPath);
	const anchorRect = anchorElement ? rectToBox(anchorElement.getBoundingClientRect()) : bounds;
	const { markerLeft, markerTop } = getMarkerFromRects(anchorRect ? [anchorRect] : [], bounds);

	return {
		rects,
		bounds,
		markerLeft,
		markerTop,
		resolvedCount: resolvedElements.length
	};
};

export const buildAreaSelectionAnchor = (
	box: RectBox,
	markerLeft: number,
	markerTop: number
): AreaSelectionAnchor => ({
	bounds: toAbsoluteRect(box),
	fallbackMarker: toFallbackMarker(markerLeft, markerTop)
});

export const resolveAreaSelection = (anchor: AreaSelectionAnchor) => {
	const bounds = absoluteToViewportRect(anchor.bounds);
	const { markerLeft, markerTop } = markerFromFallback(anchor.fallbackMarker);

	return {
		bounds,
		markerLeft,
		markerTop
	};
};
