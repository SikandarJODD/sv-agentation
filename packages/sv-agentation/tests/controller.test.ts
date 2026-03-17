import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CopyOpenController } from '../src/lib/copy-open.svelte';
import {
	buildComposerState,
	createEmptySourceInfo,
	getPageStorageKey,
	readStoredNotes
} from '../src/lib/utils/notes';

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

describe('CopyOpenController', () => {
	beforeEach(() => {
		localStorage.clear();
		setViewport(1280, 720);
		window.history.replaceState({}, '', '/');
		document.body.innerHTML = '<main><article><p>Hello world</p></article></main>';
	});

	it('toggles inspector and toolbar state', () => {
		const controller = new CopyOpenController();

		expect(controller.enabled).toBe(false);
		controller.toggle();
		expect(controller.enabled).toBe(true);

		controller.toggleToolbar();
		expect(controller.toolbar.expanded).toBe(true);

		controller.toggleSettings();
		expect(controller.toolbar.settingsOpen).toBe(true);

		controller.destroy();
	});

	it('saves, deletes, and clears notes', async () => {
		const controller = new CopyOpenController();
		controller.composer = buildComposerState({
			noteId: null,
			noteKind: 'element',
			initialValue: '',
			targetSummary: 'paragraph',
			targetLabel: 'paragraph',
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
			sourceInfo: createEmptySourceInfo('p')
		});
		controller.noteDraft = 'Clarify this block.';

		expect(await controller.saveComposer()).toBe(true);
		expect(controller.notes).toHaveLength(1);
		expect(controller.renderedNotes).toHaveLength(1);

		expect(readStoredNotes(getPageStorageKey())).toHaveLength(1);

		const savedNoteId = controller.notes[0]?.id;
		if (!savedNoteId) {
			throw new Error('expected a saved note id');
		}

		controller.deleteNote(savedNoteId);
		expect(controller.notes).toHaveLength(0);

		controller.composer = buildComposerState({
			noteId: null,
			noteKind: 'area',
			initialValue: '',
			targetSummary: 'Area selection',
			targetLabel: 'Area selection (120 x 60)',
			placeholder: 'What should change ?',
			accentColor: '#14CE4C',
			markerLeft: 140,
			markerTop: 180,
			outlineRects: [],
			highlightRects: [],
			selectedText: null,
			anchor: {
				bounds: {
					left: 40,
					top: 80,
					width: 120,
					height: 60
				},
				fallbackMarker: {
					xPercent: 50,
					yAbsolute: 180
				}
			},
			sourceInfo: createEmptySourceInfo()
		});
		controller.noteDraft = 'Rework this area.';
		expect(await controller.saveComposer()).toBe(true);

		controller.confirmDeleteAll();
		expect(controller.notes).toHaveLength(0);
		expect(controller.renderedNotes).toHaveLength(0);
		controller.destroy();
	});

	it('keeps notes and toolbar placement scoped to pathname sessions', async () => {
		const controller = new CopyOpenController({ pageSessionKey: '/' });
		controller.composer = buildComposerState({
			noteId: null,
			noteKind: 'element',
			initialValue: '',
			targetSummary: 'paragraph',
			targetLabel: 'paragraph',
			placeholder: 'What should change ?',
			accentColor: '#14CE4C',
			markerLeft: 120,
			markerTop: 120,
			outlineRects: [],
			highlightRects: [],
			selectedText: null,
			anchor: {
				domPath: '0/0/0',
				relativeX: 0.5,
				relativeY: 0.5,
				viewportX: 120,
				viewportY: 120
			},
			sourceInfo: createEmptySourceInfo('p')
		});
		controller.noteDraft = 'Root note.';
		await controller.saveComposer();
		controller.setToolbarPosition('top-left');

		expect(readStoredNotes('/')).toHaveLength(1);

		window.history.replaceState({}, '', '/changelog');
		controller.updateOptions({ pageSessionKey: '/changelog' });

		expect(controller.notes).toHaveLength(0);
		expect(controller.toolbarPositionPreset).toBe('bottom-right');

		controller.composer = buildComposerState({
			noteId: null,
			noteKind: 'element',
			initialValue: '',
			targetSummary: 'paragraph',
			targetLabel: 'paragraph',
			placeholder: 'What should change ?',
			accentColor: '#14CE4C',
			markerLeft: 160,
			markerTop: 160,
			outlineRects: [],
			highlightRects: [],
			selectedText: null,
			anchor: {
				domPath: '0/0/0',
				relativeX: 0.5,
				relativeY: 0.5,
				viewportX: 160,
				viewportY: 160
			},
			sourceInfo: createEmptySourceInfo('p')
		});
		controller.noteDraft = 'Changelog note.';
		await controller.saveComposer();
		controller.setToolbarPosition('top-center');

		expect(readStoredNotes('/changelog')).toHaveLength(1);

		window.history.replaceState({}, '', '/');
		controller.updateOptions({ pageSessionKey: '/' });

		expect(controller.notes).toHaveLength(1);
		expect(controller.notes[0]?.note).toBe('Root note.');
		expect(controller.toolbarPositionPreset).toBe('top-left');
		controller.destroy();
	});

	it('hides stale notes when the live pathname no longer matches the note capture', async () => {
		const controller = new CopyOpenController({ pageSessionKey: '/' });
		controller.composer = buildComposerState({
			noteId: null,
			noteKind: 'element',
			initialValue: '',
			targetSummary: 'paragraph',
			targetLabel: 'paragraph',
			placeholder: 'What should change ?',
			accentColor: '#14CE4C',
			markerLeft: 120,
			markerTop: 120,
			outlineRects: [],
			highlightRects: [],
			selectedText: null,
			anchor: {
				domPath: '0/0/0',
				relativeX: 0.5,
				relativeY: 0.5,
				viewportX: 120,
				viewportY: 120
			},
			sourceInfo: createEmptySourceInfo('p')
		});
		controller.noteDraft = 'Only for root.';
		await controller.saveComposer();

		expect(controller.notes).toHaveLength(1);
		expect(controller.renderedNotes).toHaveLength(1);

		window.history.replaceState({}, '', '/changelog');
		controller.refreshRenderedNotes();

		expect(controller.notes).toHaveLength(1);
		expect(controller.renderedNotes).toHaveLength(0);
		controller.destroy();
	});

	it('copies with callback-only mode and pauses animations when enabled', async () => {
		const onCopy = vi.fn();
		const controller = new CopyOpenController({
			copyToClipboard: false,
			onCopy,
			pauseAnimations: true
		});

		controller.composer = buildComposerState({
			noteId: null,
			noteKind: 'element',
			initialValue: '',
			targetSummary: 'button',
			targetLabel: 'button.submit-btn',
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
		});
		controller.noteDraft = 'Update this action.';
		await controller.saveComposer();

		controller.toggle();
		expect(document.head.innerHTML).toContain('sv-agentation-pause-animations');

		await expect(controller.copyNotes()).resolves.toBe(true);
		expect(onCopy).toHaveBeenCalledTimes(1);

		controller.toggle();
		expect(document.head.innerHTML).not.toContain('sv-agentation-pause-animations');
		controller.destroy();
	});
});
