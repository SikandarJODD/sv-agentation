import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';

import NoteComposer from '../src/lib/components/note-composer.svelte';
import { buildComposerState, createEmptySourceInfo } from '../src/lib/utils/notes';

describe('NoteComposer shortcuts', () => {
	let mountedComponent: Record<string, any> | null = null;
	let target: HTMLDivElement;

	beforeEach(() => {
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

	it('supports custom submit bindings', () => {
		const onSubmit = vi.fn();

		mountedComponent = mount(NoteComposer, {
			target,
			props: {
				composer: buildComposerState({
					noteId: null,
					noteKind: 'element',
					initialValue: '',
					targetSummary: 'button',
					targetLabel: 'button.primary',
					placeholder: 'What should change ?',
					accentColor: '#14CE4C',
					markerLeft: 120,
					markerTop: 120,
					outlineRects: [],
					highlightRects: [],
					selectedText: null,
					anchor: {
						domPath: '0/0',
						relativeX: 0.5,
						relativeY: 0.5,
						viewportX: 120,
						viewportY: 120
					},
					sourceInfo: createEmptySourceInfo('button')
				}),
				keyBindings: {
					delete: 'D',
					submit: 'Alt+S'
				},
				value: 'Ship it',
				onCancel: vi.fn(),
				onDelete: vi.fn(),
				onInput: vi.fn(),
				onSubmit
			}
		});
		flushSync();

		const textarea = target.querySelector('textarea');
		if (!(textarea instanceof HTMLTextAreaElement)) {
			throw new Error('expected textarea');
		}

		textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 's', bubbles: true }));
		expect(onSubmit).not.toHaveBeenCalled();

		textarea.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: 's',
				altKey: true,
				bubbles: true
			})
		);
		expect(onSubmit).toHaveBeenCalledTimes(1);
	});

	it('supports custom delete bindings only for existing notes', async () => {
		const onDelete = vi.fn();

		mountedComponent = mount(NoteComposer, {
			target,
			props: {
				composer: buildComposerState({
					noteId: 'note-1',
					noteKind: 'element',
					initialValue: 'Keep this',
					targetSummary: 'button',
					targetLabel: 'button.primary',
					placeholder: 'What should change ?',
					accentColor: '#14CE4C',
					markerLeft: 120,
					markerTop: 120,
					outlineRects: [],
					highlightRects: [],
					selectedText: null,
					anchor: {
						domPath: '0/0',
						relativeX: 0.5,
						relativeY: 0.5,
						viewportX: 120,
						viewportY: 120
					},
					sourceInfo: createEmptySourceInfo('button')
				}),
				keyBindings: {
					delete: 'Alt+D',
					submit: 'Enter'
				},
				value: 'Keep this',
				onCancel: vi.fn(),
				onDelete,
				onInput: vi.fn(),
				onSubmit: vi.fn()
			}
		});
		flushSync();

		const textarea = target.querySelector('textarea');
		if (!(textarea instanceof HTMLTextAreaElement)) {
			throw new Error('expected textarea');
		}

		textarea.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: 'd',
				altKey: true,
				bubbles: true
			})
		);
		expect(onDelete).toHaveBeenCalledWith('note-1');

		await unmount(mountedComponent);
		mountedComponent = null;

		const nextDelete = vi.fn();
		mountedComponent = mount(NoteComposer, {
			target,
			props: {
				composer: buildComposerState({
					noteId: null,
					noteKind: 'element',
					initialValue: '',
					targetSummary: 'button',
					targetLabel: 'button.primary',
					placeholder: 'What should change ?',
					accentColor: '#14CE4C',
					markerLeft: 120,
					markerTop: 120,
					outlineRects: [],
					highlightRects: [],
					selectedText: null,
					anchor: {
						domPath: '0/0',
						relativeX: 0.5,
						relativeY: 0.5,
						viewportX: 120,
						viewportY: 120
					},
					sourceInfo: createEmptySourceInfo('button')
				}),
				keyBindings: {
					delete: 'Alt+D',
					submit: 'Enter'
				},
				value: 'Draft',
				onCancel: vi.fn(),
				onDelete: nextDelete,
				onInput: vi.fn(),
				onSubmit: vi.fn()
			}
		});
		flushSync();

		const nextTextarea = target.querySelector('textarea');
		if (!(nextTextarea instanceof HTMLTextAreaElement)) {
			throw new Error('expected textarea');
		}

		nextTextarea.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: 'd',
				altKey: true,
				bubbles: true
			})
		);
		expect(nextDelete).not.toHaveBeenCalled();
	});
});
