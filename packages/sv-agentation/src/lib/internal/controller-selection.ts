import type { DragSelectionState, RectBox } from '../types';
import {
	buildDomPath,
	isInspectorUiTarget,
	matchesSelectorScope
} from '../utils/dom';
import { serializeTextSelection } from '../utils/selection';
import {
	DRAG_CANDIDATE_SELECTOR,
	DRAG_THRESHOLD,
	DRAG_UPDATE_THROTTLE,
	type GroupSelectionItem,
	type MouseDownState
} from './controller-state.svelte';

export const toggleGroupSelectionItems = (
	items: GroupSelectionItem[],
	target: Element
) => {
	const domPath = buildDomPath(target);
	if (!domPath) return items;

	const existingIndex = items.findIndex((item) => item.domPath === domPath);
	if (existingIndex >= 0) {
		return items.filter((_, index) => index !== existingIndex);
	}

	return [...items, { element: target, domPath }];
};

export const resolvePendingGroupElements = (items: GroupSelectionItem[]) =>
	items.filter((item) => document.contains(item.element)).map((item) => item.element);

export const findSelectableElementsInRect = (selection: RectBox, selector: string | null) => {
	const querySelector = selector
		? `${selector}, ${selector} ${DRAG_CANDIDATE_SELECTOR}`
		: DRAG_CANDIDATE_SELECTOR;
	const allCandidates = Array.from(document.querySelectorAll(querySelector))
		.filter((element): element is Element => element instanceof Element)
		.filter((element) => !isInspectorUiTarget(element))
		.filter((element) => matchesSelectorScope(element, selector));

	const matching = allCandidates.filter((element) => {
		const rect = element.getBoundingClientRect();
		if (rect.width < 10 || rect.height < 10) return false;

		return (
			rect.left < selection.left + selection.width &&
			rect.left + rect.width > selection.left &&
			rect.top < selection.top + selection.height &&
			rect.top + rect.height > selection.top
		);
	});

	return matching.filter(
		(element) => !matching.some((other) => other !== element && element.contains(other))
	);
};

export const buildNextDragSelection = ({
	mouseDownState,
	event,
	previousSelection,
	dragActive,
	lastDragUpdate,
	selector
}: {
	mouseDownState: MouseDownState;
	event: PointerEvent;
	previousSelection: DragSelectionState | null;
	dragActive: boolean;
	lastDragUpdate: number;
	selector: string | null;
}) => {
	const left = Math.min(mouseDownState.x, event.clientX);
	const top = Math.min(mouseDownState.y, event.clientY);
	const width = Math.abs(event.clientX - mouseDownState.x);
	const height = Math.abs(event.clientY - mouseDownState.y);
	const isTwoDimensionalDrag = width >= DRAG_THRESHOLD && height >= DRAG_THRESHOLD;

	if (!dragActive && !isTwoDimensionalDrag) {
		return null;
	}

	let highlightRects: RectBox[] = [];
	let nextLastDragUpdate = lastDragUpdate;
	const now = Date.now();
	if (now - lastDragUpdate >= DRAG_UPDATE_THROTTLE) {
		nextLastDragUpdate = now;
		highlightRects = findSelectableElementsInRect({ left, top, width, height }, selector).map(
			(element) => {
				const rect = element.getBoundingClientRect();
				return {
					left: rect.left,
					top: rect.top,
					width: rect.width,
					height: rect.height
				};
			}
		);
	} else if (previousSelection) {
		highlightRects = previousSelection.highlightRects;
	}

	return {
		dragSelection: {
			left,
			top,
			width,
			height,
			highlightRects
		} satisfies DragSelectionState,
		lastDragUpdate: nextLastDragUpdate
	};
};

export const getActiveTextSelection = (selector: string | null) => {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;

	const serialized = serializeTextSelection(selection);
	if (!serialized) return null;
	if (isInspectorUiTarget(serialized.commonAncestor)) return null;
	if (!matchesSelectorScope(serialized.commonAncestor, selector)) return null;
	return serialized;
};
