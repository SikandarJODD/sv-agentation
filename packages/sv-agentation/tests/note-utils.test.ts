import { beforeEach, describe, expect, it } from 'vitest';

import type { InspectorNote, NotesSettings } from '../src/lib/types';
import { alignToolbarPositionForStateChange, buildMarkerOutlineVars } from '../src/lib/utils/note-layout';
import {
	buildNotesStorageKey,
	formatNotesAsMarkdown,
	readStoredNotes,
	readStoredSettings,
	renderNote,
	sanitizeDeleteAllDelayMs,
	writeStoredSettings
} from '../src/lib/utils/notes';
import { getToolbarCoordinatesForPreset } from '../src/lib/utils/position';

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

const baseSettings: NotesSettings = {
	markerColor: '#14CE4C',
	themeMode: 'dark',
	blockPageInteractions: true,
	outputMode: 'detailed',
	pauseAnimations: false,
	clearOnCopy: false,
	includeComponentContext: true,
	includeComputedStyles: true
};

const detailedNote: InspectorNote = {
	id: 'note-1',
	kind: 'text',
	note: 'Tighten the sentence.',
	targetSummary: 'paragraph: "Hello world"',
	targetLabel: 'paragraph.hero-copy',
	componentName: 'HeroCopy',
	tagName: 'p',
	filePath: 'src/routes/+page.svelte',
	shortFileName: '+page.svelte',
	lineNumber: 12,
	columnNumber: 4,
	createdAt: '2026-03-17T00:00:00.000Z',
	updatedAt: '2026-03-17T00:00:00.000Z',
	capture: {
		page: {
			title: '/dashboard',
			pathname: '/dashboard',
			url: 'https://example.com/dashboard',
			viewport: { width: 1280, height: 720 },
			userAgent: 'Chrome/Test',
			devicePixelRatio: 2,
			timestamp: '2026-03-17T00:00:00.000Z'
		},
		element: {
			selector: '.hero > p.hero-copy',
			fullDomPath: 'body > main > section.hero > p.hero-copy',
			cssClasses: ['hero-copy'],
			components: {
				filtered: ['App', 'HeroSection', 'HeroCopy'],
				smart: ['HeroCopy'],
				all: ['App', 'LayoutShell', 'HeroSection', 'HeroCopy']
			},
			boundingBox: {
				x: 120,
				y: 240,
				width: 320,
				height: 48
			},
			position: {
				x: 280,
				y: 264,
				xPercent: 21.9,
				yAbsolute: 264
			},
			selectedText: 'Hello world',
			nearbyText: 'Hello world from the dashboard hero section',
			accessibility: 'none',
			computedStyles: {
				color: 'rgb(17, 24, 39)',
				'font-size': '16px'
			}
		}
	},
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
};

describe('note utils', () => {
	beforeEach(() => {
		localStorage.clear();
		setViewport(1280, 720);
		Object.defineProperty(window, 'scrollY', {
			configurable: true,
			value: 0
		});
		window.history.replaceState({}, '', '/');
	});

	it('sanitizes delete delays and marker colors', () => {
		expect(sanitizeDeleteAllDelayMs(undefined)).toBe(3000);
		expect(sanitizeDeleteAllDelayMs(-10)).toBe(3000);
		expect(sanitizeDeleteAllDelayMs(1200)).toBe(1200);

		expect(buildMarkerOutlineVars('#14CE4C').foreground).toBe('#FFFFFF');
		expect(buildMarkerOutlineVars('bad-color').background).toContain('rgba');
	});

	it('formats notes as markdown with detailed output mode', async () => {
		const { markdown } = await formatNotesAsMarkdown([detailedNote], baseSettings);

		expect(markdown).toContain('## Page Feedback: /dashboard');
		expect(markdown).toContain('**Selector:** `.hero > p.hero-copy`');
		expect(markdown).toContain('**Components:** `<HeroCopy>`');
		expect(markdown).toContain('**Selected text:** "Hello world"');
		expect(markdown).toContain('**Issue:** Tighten the sentence.');
	});

	it('persists output mode and toggle settings', () => {
		writeStoredSettings({
			...baseSettings,
			outputMode: 'forensic',
			pauseAnimations: true,
			clearOnCopy: true,
			includeComponentContext: false
		});

		expect(readStoredSettings(baseSettings)).toMatchObject({
			outputMode: 'forensic',
			pauseAnimations: true,
			clearOnCopy: true,
			includeComponentContext: false,
			includeComputedStyles: true
		});
	});

	it('migrates legacy route note storage into pathname sessions', () => {
		window.history.replaceState({}, '', '/dashboard?tab=legacy');
		const legacyPageKey = `${window.location.origin}${window.location.pathname}${window.location.search}`;
		localStorage.setItem(buildNotesStorageKey(legacyPageKey), JSON.stringify([detailedNote]));

		const migratedNotes = readStoredNotes('/dashboard');

		expect(migratedNotes).toHaveLength(1);
		expect(migratedNotes[0]?.id).toBe('note-1');
		expect(localStorage.getItem(buildNotesStorageKey('/dashboard'))).toContain('note-1');
	});

	it('hides resolved markers when anchors are offscreen and keeps fallback markers clamped', () => {
		document.body.innerHTML = '<main><header><h1>Hero title</h1></header></main>';
		const heading = document.querySelector('h1');
		if (!(heading instanceof HTMLElement)) {
			throw new Error('expected heading');
		}

		heading.getBoundingClientRect = () =>
			({
				x: 60,
				y: -980,
				left: 60,
				top: -980,
				right: 260,
				bottom: -940,
				width: 200,
				height: 40,
				toJSON: () => ({})
			}) as DOMRect;

		const resolvedNote: InspectorNote = {
			id: 'resolved-note',
			kind: 'element',
			note: 'Check hero alignment.',
			targetSummary: 'heading',
			targetLabel: 'heading.hero-title',
			componentName: null,
			tagName: 'h1',
			filePath: 'src/routes/+page.svelte',
			shortFileName: '+page.svelte',
			lineNumber: 8,
			columnNumber: 2,
			createdAt: '2026-03-17T00:00:00.000Z',
			updatedAt: '2026-03-17T00:00:00.000Z',
			anchor: {
				domPath: '0/0/0',
				relativeX: 0.5,
				relativeY: 0.5,
				viewportX: 120,
				viewportY: 32
			}
		};

		const resolvedRendered = renderNote(resolvedNote);
		expect(resolvedRendered.resolution).toBe('resolved');
		expect(resolvedRendered.position?.visibleInViewport).toBe(false);
		expect(resolvedRendered.position?.markerTop).toBeLessThan(0);

		const fallbackRendered = renderNote({
			...detailedNote,
			id: 'fallback-note',
			anchor: {
				...detailedNote.anchor,
				commonAncestorPath: '9/9',
				fallbackMarker: {
					xPercent: -20,
					yAbsolute: -100
				}
			}
		});

		expect(fallbackRendered.resolution).toBe('unresolved');
		expect(fallbackRendered.position?.visibleInViewport).toBe(true);
		expect(fallbackRendered.position?.markerLeft).toBe(12);
		expect(fallbackRendered.position?.markerTop).toBe(12);
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
