import type {
	NotesSettings,
	RectBox,
	ThemeMode,
	ToolbarCoordinates
} from '../types';
import { clampNumber } from './dom';
import {
	buildAreaSelectionAnchor,
	buildGroupSelectionAnchor,
	getBoundsFromRects
} from './selection';

const TOOLBAR_MARGIN = 8;
const PANEL_GAP = 20;

export const DEFAULT_DELETE_ALL_DELAY_MS = 3000;
export const COLLAPSED_TOOLBAR_SIZE = 52;
export const EXPANDED_TOOLBAR_WIDTH = 266;
export const EXPANDED_TOOLBAR_HEIGHT = 52;
export const COMPOSER_WIDTH = 280;
export const COMPOSER_HEIGHT = 180;
export const CLAMPED_TOOLBAR_MARGIN = TOOLBAR_MARGIN;
export const GROUP_SELECTION_COLOR = '#14CE4C';

export const DEFAULT_MARKER_COLORS = [
	'#6157F4',
	'#0A84FF',
	'#14B8D4',
	'#14CE4C',
	'#FACC15',
	'#FB8C00',
	'#FF1744'
] as const;

export const DEFAULT_NOTES_SETTINGS: NotesSettings = {
	markerColor: '#14CE4C',
	themeMode: 'dark',
	blockPageInteractions: true,
	outputDetail: 'standard'
};

const normalizeHexColor = (value: string) => {
	const normalized = value.trim();
	if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)) return null;

	if (normalized.length === 4) {
		return `#${normalized
			.slice(1)
			.split('')
			.map((segment) => `${segment}${segment}`)
			.join('')}`.toUpperCase();
	}

	return normalized.toUpperCase();
};

const hexToRgb = (value: string) => {
	const normalized = normalizeHexColor(value);
	if (!normalized) return null;

	const numeric = Number.parseInt(normalized.slice(1), 16);
	return {
		r: (numeric >> 16) & 255,
		g: (numeric >> 8) & 255,
		b: numeric & 255
	};
};

const rgbToRgba = (value: { r: number; g: number; b: number }, alpha: number) =>
	`rgba(${value.r}, ${value.g}, ${value.b}, ${alpha})`;

const getReadableOnColor = (value: { r: number; g: number; b: number }) => {
	const luminance = (0.2126 * value.r + 0.7152 * value.g + 0.0722 * value.b) / 255;
	return luminance > 0.62 ? '#17181C' : '#FFFFFF';
};

export const buildMarkerOutlineVars = (markerColor: string) => {
	const rgb = hexToRgb(markerColor);
	if (!rgb) {
		return {
			border: 'rgba(20, 206, 76, 0.82)',
			background: 'rgba(20, 206, 76, 0.08)',
			inner: 'rgba(20, 206, 76, 0.12)',
			foreground: '#FFFFFF'
		};
	}

	return {
		border: rgbToRgba(rgb, 0.82),
		background: rgbToRgba(rgb, 0.08),
		inner: rgbToRgba(rgb, 0.12),
		foreground: getReadableOnColor(rgb)
	};
};

export const createDefaultToolbarPosition = (): ToolbarCoordinates => {
	if (typeof window === 'undefined') {
		return { x: TOOLBAR_MARGIN, y: TOOLBAR_MARGIN };
	}

	return {
		x: Math.max(TOOLBAR_MARGIN, window.innerWidth - COLLAPSED_TOOLBAR_SIZE - TOOLBAR_MARGIN),
		y: Math.max(TOOLBAR_MARGIN, window.innerHeight - COLLAPSED_TOOLBAR_SIZE - TOOLBAR_MARGIN)
	};
};

export const clampToolbarPosition = (
	position: ToolbarCoordinates,
	expanded: boolean,
	size?: {
		width?: number;
		height?: number;
	}
): ToolbarCoordinates => {
	if (typeof window === 'undefined') return position;

	const width = Math.max(
		1,
		Math.ceil(size?.width ?? (expanded ? EXPANDED_TOOLBAR_WIDTH : COLLAPSED_TOOLBAR_SIZE))
	);
	const height = Math.max(
		1,
		Math.ceil(size?.height ?? (expanded ? EXPANDED_TOOLBAR_HEIGHT : COLLAPSED_TOOLBAR_SIZE))
	);

	return {
		x: clampNumber(
			position.x,
			TOOLBAR_MARGIN,
			Math.max(TOOLBAR_MARGIN, window.innerWidth - width - TOOLBAR_MARGIN)
		),
		y: clampNumber(
			position.y,
			TOOLBAR_MARGIN,
			Math.max(TOOLBAR_MARGIN, window.innerHeight - height - TOOLBAR_MARGIN)
		)
	};
};

export const alignToolbarPositionForStateChange = (
	position: ToolbarCoordinates,
	fromExpanded: boolean,
	toExpanded: boolean,
	alignment: {
		horizontal: 'left' | 'center' | 'right';
		vertical: 'top' | 'middle' | 'bottom';
	} = {
		horizontal: 'right',
		vertical: 'bottom'
	}
) => {
	const fromWidth = fromExpanded ? EXPANDED_TOOLBAR_WIDTH : COLLAPSED_TOOLBAR_SIZE;
	const fromHeight = fromExpanded ? EXPANDED_TOOLBAR_HEIGHT : COLLAPSED_TOOLBAR_SIZE;
	const toWidth = toExpanded ? EXPANDED_TOOLBAR_WIDTH : COLLAPSED_TOOLBAR_SIZE;
	const toHeight = toExpanded ? EXPANDED_TOOLBAR_HEIGHT : COLLAPSED_TOOLBAR_SIZE;
	const horizontalDelta =
		alignment.horizontal === 'left'
			? 0
			: alignment.horizontal === 'center'
				? (fromWidth - toWidth) / 2
				: fromWidth - toWidth;
	const verticalDelta =
		alignment.vertical === 'top'
			? 0
			: alignment.vertical === 'middle'
				? (fromHeight - toHeight) / 2
				: fromHeight - toHeight;

	return clampToolbarPosition(
		{
			x: position.x + horizontalDelta,
			y: position.y + verticalDelta
		},
		toExpanded,
		{
			width: toWidth,
			height: toHeight
		}
	);
};

export const getComposerPosition = (markerLeft: number, markerTop: number) => {
	if (typeof window === 'undefined') {
		return {
			panelLeft: markerLeft - COMPOSER_WIDTH / 2,
			panelTop: markerTop + PANEL_GAP
		};
	}

	let panelLeft = markerLeft - COMPOSER_WIDTH / 2;
	let panelTop = markerTop + PANEL_GAP;
	if (panelTop + COMPOSER_HEIGHT > window.innerHeight - 20) {
		panelTop = markerTop - COMPOSER_HEIGHT - PANEL_GAP;
	}

	return {
		panelLeft: clampNumber(panelLeft, 20, Math.max(20, window.innerWidth - COMPOSER_WIDTH - 20)),
		panelTop: clampNumber(panelTop, 20, Math.max(20, window.innerHeight - COMPOSER_HEIGHT - 20))
	};
};

export const buildAreaComposerVisuals = (bounds: RectBox) => {
	const markerLeft = clampNumber(bounds.left + bounds.width, 12, window.innerWidth - 12);
	const markerTop = clampNumber(bounds.top + bounds.height, 12, window.innerHeight - 12);
	return {
		bounds,
		markerLeft,
		markerTop
	};
};

export const buildGroupSelectionFromRects = (rects: RectBox[]) => {
	const bounds = getBoundsFromRects(rects);
	if (!bounds) return null;

	const markerLeft = clampNumber(bounds.left + bounds.width, 12, window.innerWidth - 12);
	const markerTop = clampNumber(bounds.top + bounds.height, 12, window.innerHeight - 12);
	return {
		bounds,
		markerLeft,
		markerTop
	};
};

export const createAreaAnchorFromBounds = (
	bounds: RectBox,
	markerLeft: number,
	markerTop: number
) => buildAreaSelectionAnchor(bounds, markerLeft, markerTop);

export const createGroupAnchorFromElements = (
	elements: Element[],
	anchorElement: Element,
	markerLeft: number,
	markerTop: number
) => buildGroupSelectionAnchor(elements, anchorElement, markerLeft, markerTop);
