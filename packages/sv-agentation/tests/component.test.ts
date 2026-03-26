import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';

import Agentation from '../src/lib/element-source-inspector.svelte';
import AgentationHarness from './fixtures/agentation-harness.svelte';
import NoteMarkers from '../src/lib/components/note-markers.svelte';
import {
	COLLAPSED_TOOLBAR_SIZE,
	DEFAULT_NOTES_SETTINGS,
	EXPANDED_TOOLBAR_WIDTH,
	readStoredSettings,
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

describe('Agentation component', () => {
	let mountedComponent: Record<string, any> | null = null;
	let target: HTMLDivElement;

	beforeEach(() => {
		localStorage.clear();
		setViewport(1280, 720);
		window.history.replaceState({}, '', '/');
		document.body.innerHTML = '';
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
		target = document.createElement('div');
		document.body.appendChild(target);
	});

	afterEach(async () => {
		if (mountedComponent) {
			await unmount(mountedComponent);
		}

		mountedComponent = null;
		document.body.innerHTML = '';
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
		expect(target.textContent).toContain(
			'Press R to reset to the position of toolbar'
		);

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
							visibleInViewport: true
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
							visibleInViewport: true
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

});
