import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	DEFAULT_KEY_BINDINGS,
	matchesKeyBinding,
	parseKeyBinding,
	resolveKeyBindings
} from '../src/lib/utils/shortcuts';

describe('shortcut utilities', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('merges defaults when no overrides are provided', () => {
		const { keyBindings } = resolveKeyBindings({});

		expect(keyBindings).toEqual(DEFAULT_KEY_BINDINGS);
	});

	it('normalizes aliases and matches modifier shortcuts', () => {
		expect(parseKeyBinding(' control + shift + o ')).toMatchObject({
			label: 'Ctrl+Shift+O'
		});
		expect(parseKeyBinding('Esc')).toMatchObject({
			label: 'Escape'
		});
		expect(parseKeyBinding('Mod+r')).toMatchObject({
			label: 'Mod+R'
		});

		expect(
			matchesKeyBinding(
				{
					key: 'I',
					altKey: true,
					ctrlKey: false,
					metaKey: false,
					shiftKey: false
				},
				'Alt+I'
			)
		).toBe(true);
		expect(
			matchesKeyBinding(
				{
					key: 'i',
					altKey: false,
					ctrlKey: true,
					metaKey: false,
					shiftKey: false
				},
				'Ctrl+I'
			)
		).toBe(true);
		expect(
			matchesKeyBinding(
				{
					key: 'r',
					altKey: false,
					ctrlKey: true,
					metaKey: false,
					shiftKey: false
				},
				'Mod+R'
			)
		).toBe(true);
		expect(
			matchesKeyBinding(
				{
					key: 'r',
					altKey: false,
					ctrlKey: false,
					metaKey: true,
					shiftKey: false
				},
				'Mod+R'
			)
		).toBe(true);
	});

	it('allows disabling individual actions with null', () => {
		const { keyBindings } = resolveKeyBindings({
			open: null
		});

		expect(keyBindings.open).toBeNull();
		expect(keyBindings.inspect).toBe(DEFAULT_KEY_BINDINGS.inspect);
	});

	it('falls back to defaults for invalid bindings and warns in dev', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const { keyBindings } = resolveKeyBindings({
			reset: 'Ctrl+Alt'
		});

		expect(keyBindings.reset).toBe(DEFAULT_KEY_BINDINGS.reset);
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining('Ignoring invalid key binding for "reset"')
		);
	});

	it('disables later duplicate bindings and warns', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const { keyBindings } = resolveKeyBindings({
			copy: 'Alt+I',
			inspect: 'Alt+I'
		});

		expect(keyBindings.inspect).toBe('Alt+I');
		expect(keyBindings.copy).toBeNull();
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining('Ignoring duplicate key binding "Alt+I" for "copy"')
		);
	});
});
