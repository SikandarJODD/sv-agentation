import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';

import Agentation from '../src/lib/element-source-inspector.svelte';
import AgentationHarness from './fixtures/agentation-harness.svelte';
import HoverCard from '../src/lib/components/hover-card.svelte';
import NoteMarkers from '../src/lib/components/note-markers.svelte';
import NoteComposer from '../src/lib/components/note-composer.svelte';
import {
	buildComposerState,
	COLLAPSED_TOOLBAR_SIZE,
	DEFAULT_NOTES_SETTINGS,
	EXPANDED_TOOLBAR_WIDTH,
	createEmptySourceInfo,
	readStoredSettings,
	writeStoredNotes,
	writeStoredSettings
} from '../src/lib/utils/notes';
import {
	getToolbarCoordinatesForPreset,
	readStoredToolbarPlacement,
	writeStoredToolbarPlacement
} from '../src/lib/utils/position';

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

const clickButton = (button: Element | null) => {
	if (!(button instanceof HTMLButtonElement)) {
		throw new Error('expected button');
	}

	button.click();
	flushSync();
};

const clickButtonAsync = async (button: Element | null) => {
	if (!(button instanceof HTMLButtonElement)) {
		throw new Error('expected button');
	}

	button.click();
	await Promise.resolve();
	await Promise.resolve();
	flushSync();
};

const dispatchWindowKey = (key: string, init: KeyboardEventInit = {}) => {
	window.dispatchEvent(
		new KeyboardEvent('keydown', {
			key,
			bubbles: true,
			...init
		})
	);
	flushSync();
};

const dispatchClick = (element: Element | null, init: MouseEventInit = {}) => {
	if (!(element instanceof Element)) {
		throw new Error('expected click target');
	}

	element.dispatchEvent(
		new MouseEvent('click', {
			bubbles: true,
			button: 0,
			...init
		})
	);
	flushSync();
};

const dispatchClickAsync = async (element: Element | null, init: MouseEventInit = {}) => {
	dispatchClick(element, init);
	await Promise.resolve();
	await Promise.resolve();
	await new Promise((resolve) => window.setTimeout(resolve, 0));
	flushSync();
};

const findButtonByText = (target: ParentNode, text: string) =>
	Array.from(target.querySelectorAll('button')).find((button) =>
		button.textContent?.includes(text)
	) ?? null;

const findSwitchForLabel = (target: ParentNode, labelText: string) => {
	const label = Array.from(target.querySelectorAll('label')).find((candidate) =>
		candidate.textContent?.includes(labelText)
	);

	if (!(label instanceof HTMLLabelElement)) {
		throw new Error(`expected switch label for ${labelText}`);
	}

	const input = label.querySelector('input');
	if (!(input instanceof HTMLInputElement)) {
		throw new Error(`expected switch input for ${labelText}`);
	}

	return input;
};

const createStoredAreaNote = (id: string, note: string, targetSummary: string, pathname = '/') => ({
	id,
	kind: 'area' as const,
	note,
	targetSummary,
	targetLabel: 'Area selection (120 x 60)',
	createdAt: '2026-03-26T00:00:00.000Z',
	updatedAt: '2026-03-26T00:00:00.000Z',
	componentName: null,
	tagName: 'section',
	filePath: '/src/routes/+page.svelte',
	shortFileName: '+page.svelte',
	lineNumber: 12,
	columnNumber: 4,
	anchor: {
		bounds: {
			left: 40,
			top: 80,
			width: 120,
			height: 60
		},
		fallbackMarker: {
			xPercent: 25,
			yAbsolute: 140
		}
	},
	capture: {
		page: {
			title: pathname,
			pathname,
			url: `http://localhost${pathname}`,
			viewport: {
				width: 1280,
				height: 720
			},
			userAgent: 'vitest',
			devicePixelRatio: 1,
			timestamp: '2026-03-26T00:00:00.000Z'
		},
		element: {
			selector: null,
			fullDomPath: null,
			cssClasses: [],
			components: {
				filtered: [],
				smart: [],
				all: []
			},
			boundingBox: {
				x: 40,
				y: 80,
				width: 120,
				height: 60
			},
			position: {
				x: 40,
				y: 80,
				xPercent: 25,
				yAbsolute: 140
			},
			selectedText: null,
			nearbyText: null,
			accessibility: null,
			computedStyles: null
		}
	}
});

describe('Agentation component', () => {
	let mountedComponent: Record<string, any> | null = null;
	let target: HTMLDivElement;

	beforeEach(() => {
		localStorage.clear();
		setViewport(1280, 720);
		window.history.replaceState({}, '', '/');
		document.body.innerHTML = '';
		document.body.removeAttribute('style');
		if (!Element.prototype.animate) {
			Object.defineProperty(Element.prototype, 'animate', {
				configurable: true,
				value: () => ({
					cancel() {},
					finished: Promise.resolve(),
					finish() {},
					onfinish: null,
					play() {}
				})
			});
		}
		Object.defineProperty(window, 'scrollTo', {
			configurable: true,
			value: () => {}
		});
		target = document.createElement('div');
		document.body.appendChild(target);
	});

	afterEach(async () => {
		if (mountedComponent) {
			await unmount(mountedComponent);
		}

		mountedComponent = null;
		document.body.innerHTML = '';
		document.body.removeAttribute('style');
	});

	it('syncs explicit persisted props into state and storage without locking the UI', async () => {
		writeStoredSettings({
			...DEFAULT_NOTES_SETTINGS,
			blockPageInteractions: false,
			outputMode: 'forensic',
			pauseAnimations: false,
			clearOnCopy: false,
			includeComponentContext: false,
			includeComputedStyles: false
		});
		writeStoredToolbarPlacement('/', {
			mode: 'preset',
			preset: 'bottom-right',
			coordinates: getToolbarCoordinatesForPreset('bottom-right', false)
		});

		mountedComponent = mount(Agentation, {
			target,
			props: {
				toolbarPosition: 'bottom-left',
				outputMode: 'compact',
				pauseAnimations: true,
				clearOnCopy: true,
				includeComponentContext: true,
				includeComputedStyles: true
			}
		});
		flushSync();

		const toolbarLayer = target.querySelector('.toolbar-layer');
		expect(toolbarLayer?.getAttribute('style')).toContain('left: 8px');
		expect(toolbarLayer?.getAttribute('style')).toContain('top: 666px');

		clickButton(target.querySelector('button[title="Open toolbar"]'));
		clickButton(target.querySelector('button[title="Toolbar settings"]'));
		clickButton(findButtonByText(target, 'Behavior'));
		clickButton(findButtonByText(target, 'Toolbar Position'));

		const outputModeButton = target.querySelector('button[aria-label="Cycle output mode"]');
		if (!(outputModeButton instanceof HTMLButtonElement)) {
			throw new Error('expected output mode button');
		}

		expect(outputModeButton.disabled).toBe(false);
		expect(target.textContent).not.toContain('Controlled by prop');
		expect(target.textContent).toContain('Press R to reset the position of toolbar');

		expect(findSwitchForLabel(target, 'Pause animations')).toMatchObject({
			checked: true,
			disabled: false
		});
		expect(findSwitchForLabel(target, 'Clear on copy')).toMatchObject({
			checked: true,
			disabled: false
		});
		expect(findSwitchForLabel(target, 'Component context')).toMatchObject({
			checked: true,
			disabled: false
		});
		expect(findSwitchForLabel(target, 'Computed styles')).toMatchObject({
			checked: true,
			disabled: false
		});

		const positionChips = Array.from(target.querySelectorAll('.position-chip'));
		expect(positionChips.length).toBeGreaterThan(0);
		expect(positionChips.every((chip) => chip instanceof HTMLButtonElement && !chip.disabled)).toBe(
			true
		);
		expect(readStoredSettings(DEFAULT_NOTES_SETTINGS)).toMatchObject({
			outputMode: 'compact',
			pauseAnimations: true,
			clearOnCopy: true,
			includeComponentContext: true,
			includeComputedStyles: true
		});
		expect(readStoredToolbarPlacement('/')).toMatchObject({ preset: 'bottom-left' });
	});

	it('does not overwrite user changes when the same explicit prop value rerenders', () => {
		mountedComponent = mount(AgentationHarness, {
			target,
			props: {
				initialProps: {
					pauseAnimations: true
				}
			}
		});
		flushSync();

		clickButton(target.querySelector('button[title="Open toolbar"]'));
		clickButton(target.querySelector('button[title="Toolbar settings"]'));
		clickButton(findButtonByText(target, 'Behavior'));

		const pauseAnimationsSwitch = findSwitchForLabel(target, 'Pause animations');
		expect(pauseAnimationsSwitch.checked).toBe(true);

		pauseAnimationsSwitch.click();
		flushSync();
		expect(findSwitchForLabel(target, 'Pause animations').checked).toBe(false);

		const setInspectorProps = mountedComponent?.setInspectorProps;
		if (typeof setInspectorProps !== 'function') {
			throw new Error('expected harness updater');
		}

		setInspectorProps({ pauseAnimations: true });
		flushSync();

		expect(findSwitchForLabel(target, 'Pause animations').checked).toBe(false);
		expect(readStoredSettings(DEFAULT_NOTES_SETTINGS).pauseAnimations).toBe(false);
	});

	it('resyncs runtime state when an explicit prop value actually changes later', () => {
		mountedComponent = mount(AgentationHarness, {
			target,
			props: {
				initialProps: {
					outputMode: 'compact'
				}
			}
		});
		flushSync();

		clickButton(target.querySelector('button[title="Open toolbar"]'));
		clickButton(target.querySelector('button[title="Toolbar settings"]'));

		clickButton(target.querySelector('button[aria-label="Cycle output mode"]'));
		expect(target.textContent).toContain('Standard');

		const setInspectorProps = mountedComponent?.setInspectorProps;
		if (typeof setInspectorProps !== 'function') {
			throw new Error('expected harness updater');
		}

		setInspectorProps({ outputMode: 'forensic' });
		flushSync();

		expect(target.textContent).toContain('Forensic');
		expect(readStoredSettings(DEFAULT_NOTES_SETTINGS).outputMode).toBe('forensic');
	});

	it('applies key binding prop updates at runtime', () => {
		mountedComponent = mount(AgentationHarness, {
			target,
			props: {
				initialProps: {
					keyBindings: {
						inspect: 'Alt+I'
					}
				}
			}
		});
		flushSync();

		clickButton(target.querySelector('button[title="Open toolbar"]'));

		const getInspectButton = () =>
			target.querySelector('button[aria-pressed]') as HTMLButtonElement | null;
		expect(getInspectButton()?.title).toBe('Start annotation mode (Alt+I)');

		dispatchWindowKey('i');
		expect(getInspectButton()?.title).toBe('Start annotation mode (Alt+I)');

		dispatchWindowKey('i', { altKey: true });
		expect(getInspectButton()?.title).toBe('Pause annotation mode (Alt+I)');

		const setInspectorProps = mountedComponent?.setInspectorProps;
		if (typeof setInspectorProps !== 'function') {
			throw new Error('expected harness updater');
		}

		setInspectorProps({
			keyBindings: {
				inspect: 'Ctrl+I'
			}
		});
		flushSync();

		dispatchWindowKey('i', { altKey: true });
		expect(getInspectButton()?.title).toBe('Pause annotation mode (Ctrl+I)');
	});

	it('keeps one toolbar shell mounted while toggling open and closed', () => {
		writeStoredToolbarPlacement('/', {
			mode: 'preset',
			preset: 'bottom-right',
			coordinates: getToolbarCoordinatesForPreset('bottom-right', false)
		});

		mountedComponent = mount(Agentation, {
			target,
			props: {
				toolbarPosition: 'bottom-right'
			}
		});
		flushSync();

		const collapsedPosition = getToolbarCoordinatesForPreset('bottom-right', false);
		const expandedPosition = getToolbarCoordinatesForPreset('bottom-right', true);
		const toolbarLayer = target.querySelector('.toolbar-layer');
		const toolbarShell = target.querySelector('.toolbar-shell');

		expect(toolbarShell).toBeInstanceOf(HTMLDivElement);
		expect(toolbarLayer?.getAttribute('style')).toContain(`left: ${collapsedPosition.x}px`);
		expect(toolbarShell?.getAttribute('style')).toContain(
			`--toolbar-shell-width: ${COLLAPSED_TOOLBAR_SIZE}px`
		);

		clickButton(target.querySelector('button[title="Open toolbar"]'));

		expect(target.querySelector('.toolbar-shell')).toBe(toolbarShell);
		expect(toolbarLayer?.getAttribute('style')).toContain(`left: ${expandedPosition.x}px`);
		expect(toolbarShell?.getAttribute('style')).toContain(
			`--toolbar-shell-width: ${EXPANDED_TOOLBAR_WIDTH}px`
		);

		clickButton(target.querySelector('button[title="Collapse toolbar"]'));

		expect(target.querySelector('.toolbar-shell')).toBe(toolbarShell);
		expect(toolbarLayer?.getAttribute('style')).toContain(`left: ${collapsedPosition.x}px`);
		expect(toolbarShell?.getAttribute('style')).toContain(
			`--toolbar-shell-width: ${COLLAPSED_TOOLBAR_SIZE}px`
		);
	});

	it('maps behavior toggle controls to the matching persisted settings', () => {
		mountedComponent = mount(Agentation, {
			target
		});
		flushSync();

		clickButton(target.querySelector('button[title="Open toolbar"]'));
		clickButton(target.querySelector('button[title="Toolbar settings"]'));
		clickButton(findButtonByText(target, 'Behavior'));

		const computedStylesSwitch = findSwitchForLabel(target, 'Computed styles');
		expect(computedStylesSwitch.checked).toBe(true);

		computedStylesSwitch.click();
		flushSync();

		expect(findSwitchForLabel(target, 'Computed styles').checked).toBe(false);
		expect(readStoredSettings(DEFAULT_NOTES_SETTINGS)).toMatchObject({
			blockPageInteractions: true,
			pauseAnimations: false,
			clearOnCopy: false,
			includeComponentContext: true,
			includeComputedStyles: false
		});

		clickButton(target.querySelector('button[title="Toolbar settings"]'));
		expect(target.querySelector('button[title="Toolbar settings"]')?.className).not.toContain(
			'active-pane'
		);
	});

	it('disables preview when the current page has no notes', () => {
		mountedComponent = mount(Agentation, {
			target
		});
		flushSync();

		clickButton(target.querySelector('button[title="Open toolbar"]'));

		const previewButton = target.querySelector('button[title="Preview notes"]');
		if (!(previewButton instanceof HTMLButtonElement)) {
			throw new Error('expected preview button');
		}

		expect(previewButton.disabled).toBe(true);
	});

	it('renders a current-page preview list and opens the selected note from it', async () => {
		writeStoredNotes('/', [
			createStoredAreaNote(
				'note-1',
				'Adjust the spacing and make the heading easier to scan across breakpoints.',
				'Landing hero heading with a very long title that should clamp cleanly in preview'
			),
			createStoredAreaNote(
				'note-2',
				'This should stay hidden on another route.',
				'Other route note',
				'/other'
			)
		]);

		mountedComponent = mount(Agentation, {
			target
		});
		flushSync();

		clickButton(target.querySelector('button[title="Open toolbar"]'));
		clickButton(target.querySelector('button[title="Preview notes"]'));

		expect(target.querySelector('.preview-panel')).toBeTruthy();
		expect(target.textContent).toContain('Preview Notes');
		expect(target.textContent).toContain('1 note');
		expect(target.textContent).toContain('Note 1');
		expect(target.textContent).toContain(
			'Landing hero heading with a very long title that should clamp cleanly in preview'
		);
		expect(target.textContent).not.toContain('Other route note');
		expect(target.querySelectorAll('.preview-item')).toHaveLength(1);
		expect(target.querySelectorAll('.toolbar-shell')).toHaveLength(1);

		await clickButtonAsync(target.querySelector('.preview-item'));
		const previewButton = target.querySelector('button[title="Preview notes"]');
		expect(previewButton?.className).not.toContain('active-pane');
		const composerInput = target.querySelector('.composer-input');
		if (!(composerInput instanceof HTMLTextAreaElement)) {
			throw new Error('expected composer input');
		}

		expect(composerInput.value).toContain('Adjust the spacing');
	});

	it('shows a pencil icon for the note currently being edited', () => {
		mountedComponent = mount(NoteMarkers, {
			target,
			props: {
				activeNoteId: null,
				composerNoteId: 'note-1',
				visible: true,
				onOpenNote: async () => true,
				notes: [
					{
						id: 'note-1',
						kind: 'element',
						note: 'Adjust this button.',
						targetSummary: 'Primary button',
						targetLabel: 'button.primary',
						createdAt: '2026-03-26T00:00:00.000Z',
						updatedAt: '2026-03-26T00:00:00.000Z',
						componentName: null,
						tagName: 'button',
						filePath: '/src/routes/+page.svelte',
						shortFileName: '+page.svelte',
						lineNumber: 12,
						columnNumber: 4,
						anchor: {
							domPath: '0/0/0',
							relativeX: 0.5,
							relativeY: 0.5,
							viewportX: 120,
							viewportY: 120
						},
						resolution: 'resolved',
						position: {
							markerLeft: 120,
							markerTop: 120,
							bounds: null,
							outlineRects: [],
							highlightRects: [],
							visibleInViewport: true,
							interactionHost: null
						}
					}
				]
			}
		});
		flushSync();

		const marker = target.querySelector('.marker');
		if (!(marker instanceof HTMLButtonElement)) {
			throw new Error('expected note marker');
		}

		expect(marker.textContent).not.toContain('1');
		expect(marker.querySelector('svg')).toBeTruthy();
	});

	it('keeps the note number for the active note marker when it is not hovered or being edited', () => {
		mountedComponent = mount(NoteMarkers, {
			target,
			props: {
				activeNoteId: 'note-1',
				composerNoteId: null,
				visible: true,
				onOpenNote: async () => true,
				notes: [
					{
						id: 'note-1',
						kind: 'element',
						note: 'Adjust this button.',
						targetSummary: 'Primary button',
						targetLabel: 'button.primary',
						createdAt: '2026-03-26T00:00:00.000Z',
						updatedAt: '2026-03-26T00:00:00.000Z',
						componentName: null,
						tagName: 'button',
						filePath: '/src/routes/+page.svelte',
						shortFileName: '+page.svelte',
						lineNumber: 12,
						columnNumber: 4,
						anchor: {
							domPath: '0/0/0',
							relativeX: 0.5,
							relativeY: 0.5,
							viewportX: 120,
							viewportY: 120
						},
						resolution: 'resolved',
						position: {
							markerLeft: 120,
							markerTop: 120,
							bounds: null,
							outlineRects: [],
							highlightRects: [],
							visibleInViewport: true,
							interactionHost: null
						}
					}
				]
			}
		});
		flushSync();

		const marker = target.querySelector('.marker');
		if (!(marker instanceof HTMLButtonElement)) {
			throw new Error('expected note marker');
		}

		expect(marker.textContent).toContain('1');
		expect(marker.querySelector('svg')).toBeFalsy();
	});

	it('opens a dialog annotation composer and keeps it interactive when the body is pointer-locked', async () => {
		document.body.style.pointerEvents = 'none';

		const dialogRoot = document.createElement('div');
		dialogRoot.style.pointerEvents = 'auto';
		const dialogContent = document.createElement('div');
		dialogContent.setAttribute('data-slot', 'dialog-content');
		dialogContent.setAttribute('role', 'dialog');
		dialogContent.style.pointerEvents = 'auto';
		const dialogTarget = document.createElement('p');
		dialogTarget.textContent = 'Dialog body copy';
		dialogContent.appendChild(dialogTarget);
		dialogRoot.appendChild(dialogContent);
		document.body.appendChild(dialogRoot);

		mountedComponent = mount(Agentation, {
			target
		});
		flushSync();

		dispatchWindowKey('i');
		await dispatchClickAsync(dialogTarget, {
			clientX: 120,
			clientY: 140
		});

		const composerInput = document.querySelector('.composer-input');
		if (!(composerInput instanceof HTMLTextAreaElement)) {
			throw new Error('expected composer input');
		}

		expect(dialogContent.contains(composerInput)).toBe(true);
		expect(target.querySelector('.composer-input')).toBeNull();
		expect(document.activeElement).toBe(composerInput);

		const submitButton = document.querySelector('.submit-button');
		if (!(submitButton instanceof HTMLButtonElement)) {
			throw new Error('expected submit button');
		}

		expect(submitButton.disabled).toBe(true);

		composerInput.value = 'Tighten this dialog copy.';
		composerInput.dispatchEvent(new Event('input', { bubbles: true }));
		flushSync();
		expect(submitButton.disabled).toBe(false);
	});

	it('keeps hover card actions clickable when the body is pointer-locked', () => {
		document.body.style.pointerEvents = 'none';
		let opened = false;

		mountedComponent = mount(HoverCard, {
			target,
			props: {
				hoverInfo: {
					componentName: 'DialogExample',
					tagName: 'p',
					targetLabel: 'paragraph: "Dialog body copy"',
					filePath: '/src/lib/components/examples/dialog-example.svelte',
					shortFileName: 'dialog-example.svelte',
					lineNumber: 8,
					columnNumber: 4,
					left: 16,
					top: 24,
					width: 120,
					height: 32,
					cardLeft: 40,
					cardTop: 40,
					copyText: 'DialogExample | dialog-example.svelte:8:4',
					vscodeUrl: 'vscode://file/src/lib/components/examples/dialog-example.svelte:8:4',
					canCopy: true,
					canOpen: true,
					interactionHost: null
				},
				onOpen: () => {
					opened = true;
					return true;
				},
				openShortcut: 'O'
			}
		});
		flushSync();

		clickButton(target.querySelector('.action-button'));
		expect(opened).toBe(true);
	});

	it('keeps composer controls clickable when the body is pointer-locked', () => {
		document.body.style.pointerEvents = 'none';
		let cancelled = false;
		let submitted = false;

		mountedComponent = mount(NoteComposer, {
			target,
			props: {
				composer: buildComposerState({
					noteId: null,
					noteKind: 'element',
					initialValue: '',
					targetSummary: 'Dialog body copy',
					targetLabel: 'paragraph: "Dialog body copy"',
					placeholder: 'What should change ?',
					accentColor: '#14CE4C',
					markerLeft: 120,
					markerTop: 140,
					outlineRects: [],
					highlightRects: [],
					selectedText: null,
					anchor: {
						domPath: '0/1',
						relativeX: 0.5,
						relativeY: 0.5,
						viewportX: 120,
						viewportY: 140
					},
					sourceInfo: createEmptySourceInfo('p')
				}),
				keyBindings: {
					delete: 'D',
					submit: 'Enter'
				},
				value: 'Tighten this dialog copy.',
				onCancel: () => {
					cancelled = true;
				},
				onDelete: () => {},
				onInput: () => {},
				onSubmit: () => {
					submitted = true;
				}
			}
		});
		flushSync();

		clickButton(target.querySelector('.cancel-button'));
		clickButton(target.querySelector('.submit-button'));

		expect(cancelled).toBe(true);
		expect(submitted).toBe(true);
	});

	it('keeps saved note markers clickable when the body is pointer-locked', async () => {
		document.body.style.pointerEvents = 'none';
		let openedNoteId: string | null = null;

		mountedComponent = mount(NoteMarkers, {
			target,
			props: {
				activeNoteId: null,
				composerNoteId: null,
				visible: true,
				onOpenNote: async (noteId: string) => {
					openedNoteId = noteId;
					return true;
				},
				notes: [
					{
						id: 'dialog-note-1',
						kind: 'element',
						note: 'Tighten this dialog copy.',
						targetSummary: 'Dialog body copy',
						targetLabel: 'paragraph: "Dialog body copy"',
						createdAt: '2026-03-26T00:00:00.000Z',
						updatedAt: '2026-03-26T00:00:00.000Z',
						componentName: 'DialogExample',
						tagName: 'p',
						filePath: '/src/lib/components/examples/dialog-example.svelte',
						shortFileName: 'dialog-example.svelte',
						lineNumber: 8,
						columnNumber: 4,
						anchor: {
							domPath: '0/1',
							relativeX: 0.5,
							relativeY: 0.5,
							viewportX: 120,
							viewportY: 140
						},
						resolution: 'resolved',
						position: {
							markerLeft: 120,
							markerTop: 140,
							bounds: null,
							outlineRects: [],
							highlightRects: [],
							visibleInViewport: true,
							interactionHost: null
						}
					}
				]
			}
		});
		flushSync();

		await clickButtonAsync(target.querySelector('.marker'));
		expect(openedNoteId).toBe('dialog-note-1');
	});
});
