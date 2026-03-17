import type {
	GroupSelectionPreviewState,
	ToolbarState
} from '../types';
import { DEFAULT_DELETE_ALL_DELAY_MS, createDefaultToolbarPosition } from '../utils/notes';

export type ToolbarDragState = {
	pointerId: number | null;
	offsetX: number;
	offsetY: number;
	width: number;
	height: number;
};

export type MouseDownState = {
	x: number;
	y: number;
	target: Element | null;
};

export type GroupSelectionItem = {
	element: Element;
	domPath: string;
};

export type UserSelectSnapshot = {
	bodyUserSelect: string;
	bodyWebkitUserSelect: string;
	documentUserSelect: string;
	documentWebkitUserSelect: string;
};

export type DeleteAllState = {
	active: boolean;
	durationMs: number;
	remainingMs: number;
	progress: number;
};

export type ModifierState = {
	shift: boolean;
	metaOrCtrl: boolean;
};

export const DRAG_THRESHOLD = 8;
export const DRAG_UPDATE_THROTTLE = 32;
export const DRAG_CANDIDATE_SELECTOR =
	'button, a, input, img, p, h1, h2, h3, h4, h5, h6, li, label, td, th, div, span, section, article, aside, nav';

export const createToolbarState = (): ToolbarState => ({
	expanded: false,
	dragging: false,
	settingsOpen: false,
	confirmDeleteAll: false,
	notesVisible: true,
	copyFeedback: false,
	position: createDefaultToolbarPosition()
});

export const createDeleteAllState = (durationMs = DEFAULT_DELETE_ALL_DELAY_MS): DeleteAllState => ({
	active: false,
	durationMs,
	remainingMs: durationMs,
	progress: 0
});

export const createModifierState = (): ModifierState => ({
	shift: false,
	metaOrCtrl: false
});

export const buildSelectionPreview = (
	items: GroupSelectionItem[]
): GroupSelectionPreviewState | null => {
	if (items.length === 0) return null;

	const rects = items
		.filter((item) => document.contains(item.element))
		.map((item) => item.element.getBoundingClientRect())
		.map((rect) => ({
			left: rect.left,
			top: rect.top,
			width: rect.width,
			height: rect.height
		}));

	return rects.length > 0 ? { rects } : null;
};
