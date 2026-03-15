import type { InspectorPosition, ToolbarCoordinates } from '../types';
import {
	CLAMPED_TOOLBAR_MARGIN as TOOLBAR_MARGIN,
	COLLAPSED_TOOLBAR_SIZE,
	EXPANDED_TOOLBAR_HEIGHT,
	EXPANDED_TOOLBAR_WIDTH,
	clampToolbarPosition
} from './notes';

export type ToolbarPositionMode = 'preset' | 'custom';

export type ToolbarPlacement = {
	mode: ToolbarPositionMode;
	preset: InspectorPosition;
	coordinates: ToolbarCoordinates;
};

type ToolbarAlignment = {
	horizontal: 'left' | 'center' | 'right';
	vertical: 'top' | 'middle' | 'bottom';
};

const STORAGE_KEY = 'sv-agentation:toolbar-placement:v2';
const LEGACY_STORAGE_KEY = 'copy-open:toolbar-placement:v2';
const LEGACY_PRESET_STORAGE_KEY = 'copy-open:inspector-position';
const RIGHT_PRESET_INSET = TOOLBAR_MARGIN + 10;

export const DEFAULT_INSPECTOR_POSITION: InspectorPosition = 'bottom-right';

export const INSPECTOR_POSITIONS = [
	'top-left',
	'top-center',
	'top-right',
	'mid-left',
	'mid-right',
	'bottom-left',
	'bottom-center',
	'bottom-right'
] as const satisfies readonly InspectorPosition[];

export const INSPECTOR_POSITION_OPTIONS = INSPECTOR_POSITIONS.map((value) => ({
	value,
	label: value
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ')
}));

const readStoredJson = <Value>(key: string) => {
	if (typeof window === 'undefined') return null;

	try {
		const rawValue = window.localStorage.getItem(key);
		if (!rawValue) return null;
		return JSON.parse(rawValue) as Value;
	} catch {
		return null;
	}
};

const writeStoredJson = (key: string, value: unknown) => {
	if (typeof window === 'undefined') return;

	try {
		window.localStorage.setItem(key, JSON.stringify(value));
	} catch {
		return;
	}
};

const isToolbarCoordinates = (value: unknown): value is ToolbarCoordinates => {
	if (!value || typeof value !== 'object') return false;

	const candidate = value as Partial<ToolbarCoordinates>;
	return (
		typeof candidate.x === 'number' &&
		Number.isFinite(candidate.x) &&
		typeof candidate.y === 'number' &&
		Number.isFinite(candidate.y)
	);
};

export const isInspectorPosition = (value: string): value is InspectorPosition =>
	INSPECTOR_POSITIONS.includes(value as InspectorPosition);

export const sanitizeInspectorPosition = (value: unknown) =>
	typeof value === 'string' && isInspectorPosition(value) ? value : DEFAULT_INSPECTOR_POSITION;

const isToolbarPositionMode = (value: unknown): value is ToolbarPositionMode =>
	value === 'preset' || value === 'custom';

const isToolbarPlacement = (value: unknown): value is ToolbarPlacement => {
	if (!value || typeof value !== 'object') return false;

	const candidate = value as Partial<ToolbarPlacement>;
	return (
		isToolbarPositionMode(candidate.mode) &&
		typeof candidate.preset === 'string' &&
		isInspectorPosition(candidate.preset) &&
		isToolbarCoordinates(candidate.coordinates)
	);
};

const getToolbarDimensions = (
	expanded: boolean,
	size?: {
		width?: number;
		height?: number;
	}
) => ({
	width: Math.max(
		1,
		Math.ceil(size?.width ?? (expanded ? EXPANDED_TOOLBAR_WIDTH : COLLAPSED_TOOLBAR_SIZE))
	),
	height: Math.max(
		1,
		Math.ceil(size?.height ?? (expanded ? EXPANDED_TOOLBAR_HEIGHT : COLLAPSED_TOOLBAR_SIZE))
	)
});

export const getToolbarAlignment = (position: InspectorPosition): ToolbarAlignment => {
	switch (position) {
		case 'top-left':
			return { horizontal: 'left', vertical: 'top' };
		case 'top-center':
			return { horizontal: 'center', vertical: 'top' };
		case 'top-right':
			return { horizontal: 'right', vertical: 'top' };
		case 'mid-left':
			return { horizontal: 'left', vertical: 'middle' };
		case 'mid-right':
			return { horizontal: 'right', vertical: 'middle' };
		case 'bottom-left':
			return { horizontal: 'left', vertical: 'bottom' };
		case 'bottom-center':
			return { horizontal: 'center', vertical: 'bottom' };
		case 'bottom-right':
		default:
			return { horizontal: 'right', vertical: 'bottom' };
	}
};

export const getToolbarCoordinatesForPreset = (
	position: InspectorPosition,
	expanded: boolean,
	size?: {
		width?: number;
		height?: number;
	}
) => {
	if (typeof window === 'undefined') {
		return { x: TOOLBAR_MARGIN, y: TOOLBAR_MARGIN };
	}

	const { width, height } = getToolbarDimensions(expanded, size);
	const rightPresetX = Math.max(TOOLBAR_MARGIN, window.innerWidth - width - RIGHT_PRESET_INSET);
	const maxY = Math.max(TOOLBAR_MARGIN, window.innerHeight - height - TOOLBAR_MARGIN);

	switch (position) {
		case 'top-left':
			return { x: TOOLBAR_MARGIN, y: TOOLBAR_MARGIN };
		case 'top-center':
			return clampToolbarPosition(
				{ x: Math.round((window.innerWidth - width) / 2), y: TOOLBAR_MARGIN },
				expanded,
				size
			);
		case 'top-right':
			return { x: rightPresetX, y: TOOLBAR_MARGIN };
		case 'mid-left':
			return clampToolbarPosition(
				{ x: TOOLBAR_MARGIN, y: Math.round((window.innerHeight - height) / 2) },
				expanded,
				size
			);
		case 'mid-right':
			return clampToolbarPosition(
				{ x: rightPresetX, y: Math.round((window.innerHeight - height) / 2) },
				expanded,
				size
			);
		case 'bottom-left':
			return { x: TOOLBAR_MARGIN, y: maxY };
		case 'bottom-center':
			return clampToolbarPosition(
				{ x: Math.round((window.innerWidth - width) / 2), y: maxY },
				expanded,
				size
			);
		case 'bottom-right':
		default:
			return { x: rightPresetX, y: maxY };
	}
};

export const getNearestInspectorPosition = (
	coordinates: ToolbarCoordinates,
	expanded: boolean,
	size?: {
		width?: number;
		height?: number;
	}
) => {
	let closestPosition: InspectorPosition = DEFAULT_INSPECTOR_POSITION;
	let closestDistance = Number.POSITIVE_INFINITY;

	for (const position of INSPECTOR_POSITIONS) {
		const presetCoordinates = getToolbarCoordinatesForPreset(position, expanded, size);
		const distance =
			(coordinates.x - presetCoordinates.x) ** 2 + (coordinates.y - presetCoordinates.y) ** 2;

		if (distance < closestDistance) {
			closestDistance = distance;
			closestPosition = position;
		}
	}

	return closestPosition;
};

const readLegacyPresetStorage = () => {
	if (typeof window === 'undefined') return null;

	try {
		const rawValue = window.localStorage.getItem(LEGACY_PRESET_STORAGE_KEY);
		return rawValue && isInspectorPosition(rawValue) ? rawValue : null;
	} catch {
		return null;
	}
};

export const readStoredToolbarPlacement = () => {
	const storedPlacement = readStoredJson<unknown>(STORAGE_KEY);
	if (isToolbarPlacement(storedPlacement)) {
		return storedPlacement;
	}

	const legacyPlacement = readStoredJson<unknown>(LEGACY_STORAGE_KEY);
	if (isToolbarPlacement(legacyPlacement)) {
		return legacyPlacement;
	}

	const legacyPreset = readLegacyPresetStorage();
	if (!legacyPreset) return null;

	return {
		mode: 'preset',
		preset: legacyPreset,
		coordinates: getToolbarCoordinatesForPreset(legacyPreset, false)
	} satisfies ToolbarPlacement;
};

export const writeStoredToolbarPlacement = (placement: ToolbarPlacement) => {
	writeStoredJson(STORAGE_KEY, placement);
};
