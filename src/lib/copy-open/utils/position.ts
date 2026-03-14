import type { InspectorPosition } from '../types';

export const DEFAULT_INSPECTOR_POSITION: InspectorPosition = 'bottom-right';
export const INSPECTOR_POSITION_STORAGE_KEY = 'copy-open:inspector-position';

export const INSPECTOR_POSITIONS = [
	'top-left',
	'top-center',
	'top-right',
	'mid-right',
	'mid-left',
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

export const isInspectorPosition = (value: string): value is InspectorPosition =>
	INSPECTOR_POSITIONS.includes(value as InspectorPosition);

export const readStoredPosition = () => {
	if (typeof window === 'undefined') return DEFAULT_INSPECTOR_POSITION;

	try {
		const storedValue = window.localStorage.getItem(INSPECTOR_POSITION_STORAGE_KEY);
		if (storedValue && isInspectorPosition(storedValue)) {
			return storedValue;
		}
	} catch {
		return DEFAULT_INSPECTOR_POSITION;
	}

	return DEFAULT_INSPECTOR_POSITION;
};

export const writeStoredPosition = (position: InspectorPosition) => {
	if (typeof window === 'undefined') return;

	try {
		window.localStorage.setItem(INSPECTOR_POSITION_STORAGE_KEY, position);
	} catch {
		return;
	}
};
