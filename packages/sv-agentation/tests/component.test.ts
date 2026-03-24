import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';

import Agentation from '../src/lib/element-source-inspector.svelte';
import { DEFAULT_NOTES_SETTINGS, writeStoredSettings } from '../src/lib/utils/notes';
import { getToolbarCoordinatesForPreset, writeStoredToolbarPlacement } from '../src/lib/utils/position';

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
	Array.from(target.querySelectorAll('button')).find((button) => button.textContent?.includes(text)) ?? null;

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

	it('uses explicit controlled props instead of conflicting stored state', async () => {
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
		expect(toolbarLayer?.getAttribute('style')).toContain('top: 660px');

		clickButton(target.querySelector('button[title="Open toolbar"]'));
		clickButton(target.querySelector('button[title="Toolbar settings"]'));
		clickButton(findButtonByText(target, 'Behavior'));
		clickButton(findButtonByText(target, 'Toolbar Position'));

		const outputModeButton = target.querySelector('button[aria-label="Cycle output mode"]');
		if (!(outputModeButton instanceof HTMLButtonElement)) {
			throw new Error('expected output mode button');
		}

		expect(outputModeButton.disabled).toBe(true);
		expect(target.textContent).toContain('Controlled by prop');
		expect(target.textContent).toContain('Press R to reset to the prop value.');

		expect(findSwitchForLabel(target, 'Pause animations')).toMatchObject({
			checked: true,
			disabled: true
		});
		expect(findSwitchForLabel(target, 'Clear on copy')).toMatchObject({
			checked: true,
			disabled: true
		});
		expect(findSwitchForLabel(target, 'Component context')).toMatchObject({
			checked: true,
			disabled: true
		});
		expect(findSwitchForLabel(target, 'Computed styles')).toMatchObject({
			checked: true,
			disabled: true
		});

		const positionChips = Array.from(target.querySelectorAll('.position-chip'));
		expect(positionChips.length).toBeGreaterThan(0);
		expect(positionChips.every((chip) => chip instanceof HTMLButtonElement && chip.disabled)).toBe(true);
	});
});
