import { beforeEach, describe, expect, it } from 'vitest';

import { CopyOpenController } from '../src/lib/copy-open.svelte';
import { buildComposerState, createEmptySourceInfo, readStoredNotes } from '../src/lib/utils/notes';

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

	it('saves, deletes, and clears notes', () => {
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

		expect(controller.saveComposer()).toBe(true);
		expect(controller.notes).toHaveLength(1);
		expect(controller.renderedNotes).toHaveLength(1);

		const pageKey = `${window.location.origin}${window.location.pathname}${window.location.search}`;
		expect(readStoredNotes(pageKey)).toHaveLength(1);

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
		expect(controller.saveComposer()).toBe(true);

		controller.confirmDeleteAll();
		expect(controller.notes).toHaveLength(0);
		expect(controller.renderedNotes).toHaveLength(0);
		controller.destroy();
	});
});
