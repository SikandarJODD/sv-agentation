import { describe, expect, it } from 'vitest';

import type { InspectorNote, NotesSettings, OutputMode } from '../src/lib/types';
import { formatNotesAsMarkdown } from '../src/lib/utils/notes';
import compactFixture from '../demo-output/compact.md?raw';
import standardFixture from '../demo-output/standard.md?raw';
import detailedFixture from '../demo-output/detailed.md?raw';
import forensicFixture from '../demo-output/forensic.md?raw';

const readDemoOutput = (name: 'compact' | 'standard' | 'detailed' | 'forensic') =>
	({
		compact: compactFixture,
		standard: standardFixture,
		detailed: detailedFixture,
		forensic: forensicFixture
	})[name]
		.replaceAll('**React:**', '**Components:**')
		.replaceAll('**React**', '**Components**')
		.replaceAll('React components', 'Components')
		.replaceAll('**Location:** `.sidebar > nav > .nav-item > span`', '**Location:** `.sidebar > nav > .nav-item > span.nav-label`')
		.replaceAll('**Selector:** `.sidebar > nav > .nav-item > span`', '**Selector:** `.sidebar > nav > .nav-item > span.nav-label`');

const normalizeLineEndings = (value: string) => value.replaceAll('\r\n', '\n').trim();

const buildSettings = (outputMode: OutputMode): NotesSettings => ({
	markerColor: '#14CE4C',
	themeMode: 'dark',
	blockPageInteractions: true,
	outputMode,
	pauseAnimations: false,
	clearOnCopy: false,
	includeComponentContext: true,
	includeComputedStyles: true
});

const buildNotes = (page: {
	title: string;
	url: string;
	viewport: { width: number; height: number };
	userAgent: string;
	timestamp: string;
	devicePixelRatio?: number;
}): InspectorNote[] => [
	{
		id: 'note-submit',
		kind: 'element',
		note: 'Button text should say "Save" not "Submit"',
		targetSummary: 'button.submit-btn',
		targetLabel: 'button.submit-btn',
		componentName: 'SubmitButton',
		tagName: 'button',
		filePath: 'src/components/FormActions.tsx',
		shortFileName: 'FormActions.tsx',
		lineNumber: 42,
		columnNumber: 5,
		createdAt: page.timestamp,
		updatedAt: page.timestamp,
		capture: {
			page: {
				title: page.title,
				pathname: page.title,
				url: page.url,
				viewport: page.viewport,
				userAgent: page.userAgent,
				devicePixelRatio: page.devicePixelRatio ?? 1,
				timestamp: page.timestamp
			},
			element: {
				selector: '.form-container > .actions > button.submit-btn',
				fullDomPath: 'body > div.app > main.dashboard > div.form-container > div.actions > button.submit-btn',
				cssClasses: ['submit-btn', 'primary'],
				components: {
					filtered: ['App', 'Dashboard', 'FormActions', 'SubmitButton'],
					smart: ['App', 'Dashboard', 'FormActions', 'SubmitButton'],
					all: ['App', 'Dashboard', 'FormActions', 'SubmitButton']
				},
				boundingBox: {
					x: 450,
					y: 320,
					width: 120,
					height: 40
				},
				position: {
					x: 683,
					y: 320,
					xPercent: 45.2,
					yAbsolute: 320
				},
				selectedText: null,
				nearbyText: 'Cancel Save Changes',
				accessibility: 'focusable',
				computedStyles: {
					'background-color': 'rgb(59, 130, 246)',
					'font-size': '14px',
					'font-weight': '600',
					padding: '8px 16px',
					'border-radius': '6px'
				}
			}
		},
		anchor: {
			domPath: '0/0',
			relativeX: 0.5,
			relativeY: 0.5,
			viewportX: 450,
			viewportY: 320
		}
	},
	{
		id: 'note-nav',
		kind: 'text',
		note: 'Typo - should be "Settings"',
		targetSummary: 'span.nav-label',
		targetLabel: 'span.nav-label',
		componentName: 'NavItem',
		tagName: 'span',
		filePath: 'src/components/Sidebar.tsx',
		shortFileName: 'Sidebar.tsx',
		lineNumber: 28,
		columnNumber: 12,
		createdAt: page.timestamp,
		updatedAt: page.timestamp,
		capture: {
			page: {
				title: page.title,
				pathname: page.title,
				url: page.url,
				viewport: page.viewport,
				userAgent: page.userAgent,
				devicePixelRatio: page.devicePixelRatio ?? 1,
				timestamp: page.timestamp
			},
			element: {
				selector: '.sidebar > nav > .nav-item > span.nav-label',
				fullDomPath:
					'body > div.app > aside.sidebar > nav > div.nav-item:nth-child(2) > span.nav-label',
				cssClasses: ['nav-label'],
				components: {
					filtered: ['App', 'Sidebar', 'NavItem'],
					smart: ['App', 'Sidebar', 'NavItem'],
					all: ['App', 'Sidebar', 'NavItem']
				},
				boundingBox: {
					x: 24,
					y: 156,
					width: 64,
					height: 20
				},
				position: {
					x: 46,
					y: 156,
					xPercent: 3.2,
					yAbsolute: 156
				},
				selectedText: 'Settigns',
				nearbyText: 'Dashboard Settigns Profile',
				accessibility: 'none',
				computedStyles: {
					'font-size': '13px',
					'font-weight': '500',
					color: 'rgb(55, 65, 81)'
				}
			}
		},
		anchor: {
			commonAncestorPath: '0/1',
			selectedText: 'Settigns',
			contextBefore: '',
			contextAfter: '',
			startOffset: 0,
			endOffset: 9,
			fallbackMarker: {
				xPercent: 3.2,
				yAbsolute: 156
			}
		}
	}
];

describe('output fixtures', () => {
	it('matches compact demo output', async () => {
		const notes = buildNotes({
			title: '/dashboard',
			url: 'https://myapp.com/dashboard',
			viewport: { width: 1512, height: 738 },
			userAgent: 'Chrome/120.0',
			timestamp: '2024-01-15T10:30:00.000Z'
		});
		const { markdown } = await formatNotesAsMarkdown(notes, buildSettings('compact'));

		expect(normalizeLineEndings(markdown)).toBe(normalizeLineEndings(readDemoOutput('compact')));
	});

	it('matches standard demo output with Components wording', async () => {
		const notes = buildNotes({
			title: '/dashboard',
			url: 'https://myapp.com/dashboard',
			viewport: { width: 1512, height: 738 },
			userAgent: 'Chrome/120.0',
			timestamp: '2024-01-15T10:30:00.000Z'
		});
		const { markdown } = await formatNotesAsMarkdown(notes, buildSettings('standard'));

		expect(normalizeLineEndings(markdown)).toBe(normalizeLineEndings(readDemoOutput('standard')));
	});

	it('matches detailed demo output with Components wording', async () => {
		const notes = buildNotes({
			title: '/dashboard',
			url: 'https://myapp.com/dashboard',
			viewport: { width: 1512, height: 738 },
			userAgent: 'Chrome/120.0',
			timestamp: '2024-01-15T10:30:00.000Z'
		});
		const { markdown } = await formatNotesAsMarkdown(notes, buildSettings('detailed'));

		expect(normalizeLineEndings(markdown)).toBe(normalizeLineEndings(readDemoOutput('detailed')));
	});

	it('matches forensic demo output with Components wording', async () => {
		const notes = buildNotes({
			title: '/dashboard',
			url: 'http://localhost:3000/dashboard',
			viewport: { width: 1440, height: 900 },
			userAgent: 'Mozilla/5.0 Chrome/142.0.0.0',
			timestamp: '2024-01-15T10:30:00.000Z',
			devicePixelRatio: 2
		});
		const { markdown } = await formatNotesAsMarkdown(notes, buildSettings('forensic'));

		expect(normalizeLineEndings(markdown)).toBe(normalizeLineEndings(readDemoOutput('forensic')));
	});
});
