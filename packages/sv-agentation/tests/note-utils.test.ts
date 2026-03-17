import { describe, expect, it, beforeEach } from 'vitest';

import {
	formatNotesAsMarkdown,
	sanitizeDeleteAllDelayMs
} from '../src/lib/utils/notes';
import { getToolbarCoordinatesForPreset } from '../src/lib/utils/position';
import { alignToolbarPositionForStateChange, buildMarkerOutlineVars } from '../src/lib/utils/note-layout';
import type { InspectorNote } from '../src/lib/types';

const setViewport = (width: number, height: number) => {
	Object.defineProperty(window, 'innerWidth', {
		configurable: true,
		value: width
	});
	Object.defineProperty(window, 'innerHeight', {
		configurable: true,
		value: height
	});
};

describe('note utils', () => {
	beforeEach(() => {
		localStorage.clear();
		setViewport(1280, 720);
	});

	it('sanitizes delete delays and marker colors', () => {
		expect(sanitizeDeleteAllDelayMs(undefined)).toBe(3000);
		expect(sanitizeDeleteAllDelayMs(-10)).toBe(3000);
		expect(sanitizeDeleteAllDelayMs(1200)).toBe(1200);

		expect(buildMarkerOutlineVars('#14CE4C').foreground).toBe('#FFFFFF');
		expect(buildMarkerOutlineVars('bad-color').background).toContain('rgba');
	});

	it('formats notes as markdown', () => {
		const notes: InspectorNote[] = [
			{
				id: 'note-1',
				kind: 'text',
				note: 'Tighten the sentence.',
				targetSummary: 'paragraph: "Hello world"',
				targetLabel: 'paragraph',
				componentName: null,
				tagName: 'p',
				filePath: '/repo/src/routes/+page.svelte',
				shortFileName: '+page.svelte',
				lineNumber: 12,
				columnNumber: 4,
				createdAt: '2026-03-17T00:00:00.000Z',
				updatedAt: '2026-03-17T00:00:00.000Z',
				anchor: {
					commonAncestorPath: '0/0',
					selectedText: 'Hello world',
					contextBefore: '',
					contextAfter: '',
					startOffset: 0,
					endOffset: 11,
					fallbackMarker: {
						xPercent: 50,
						yAbsolute: 120
					}
				}
			}
		];

		const markdown = formatNotesAsMarkdown(notes);
		expect(markdown).toContain('Page Feedback');
		expect(markdown).toContain('Selected text: "Hello world"');
		expect(markdown).toContain('Source: +page.svelte:12:4');
	});

	it('keeps toolbar presets inside the viewport', () => {
		expect(getToolbarCoordinatesForPreset('bottom-right', false)).toEqual({ x: 1210, y: 660 });

		const next = alignToolbarPositionForStateChange(
			{ x: 1210, y: 660 },
			false,
			true,
			{ horizontal: 'right', vertical: 'bottom' }
		);

		expect(next.x).toBeLessThan(1210);
		expect(next.y).toBeGreaterThan(0);
	});
});
