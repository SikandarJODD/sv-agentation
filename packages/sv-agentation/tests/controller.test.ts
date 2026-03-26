import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CopyOpenController } from '../src/lib/copy-open.svelte';
import {
	buildComposerState,
	COLLAPSED_TOOLBAR_SIZE,
	createEmptySourceInfo,
	DEFAULT_NOTES_SETTINGS,
	EXPANDED_TOOLBAR_WIDTH,
	getPageStorageKey,
	readStoredNotes,
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

const createToolbarHandle = (width: number, height: number) => {
	const toolbarHandle = document.createElement('div');
	Object.defineProperty(toolbarHandle, 'getBoundingClientRect', {
		value: () => ({
			width,
			height,
			left: 0,
			top: 0,
			right: width,
			bottom: height,
			x: 0,
			y: 0,
			toJSON: () => ({})
		})
	});

	return toolbarHandle;
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
			onCopy
		});
		controller.syncPersistedProps({ pauseAnimations: true });

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

	it('syncs explicit persisted props into runtime state and storage', () => {
		writeStoredSettings({
			...DEFAULT_NOTES_SETTINGS,
			blockPageInteractions: true,
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

		const controller = new CopyOpenController({
			pageSessionKey: '/'
		});
		controller.syncPersistedProps({
			toolbarPosition: 'bottom-left',
			outputMode: 'compact',
			pauseAnimations: true,
			clearOnCopy: true,
			includeComponentContext: true,
			includeComputedStyles: true
		});

		expect(controller.toolbarPositionPreset).toBe('bottom-left');
		expect(controller.toolbar.position).toEqual({ x: 8, y: 666 });
		expect(controller.settings).toMatchObject({
			outputMode: 'compact',
			pauseAnimations: true,
			clearOnCopy: true,
			includeComponentContext: true,
			includeComputedStyles: true
		});
		expect(readStoredToolbarPlacement('/')).toMatchObject({ preset: 'bottom-left' });

		const toolbarHandle = document.createElement('div');
		Object.defineProperty(toolbarHandle, 'getBoundingClientRect', {
			value: () => ({
				width: 52,
				height: 52,
				left: 0,
				top: 0,
				right: 52,
				bottom: 52,
				x: 0,
				y: 0,
				toJSON: () => ({})
			})
		});

		controller.handleToolbarPointerDown({
			button: 0,
			pointerId: 1,
			clientX: 120,
			clientY: 120,
			currentTarget: toolbarHandle,
			preventDefault: vi.fn()
		} as unknown as PointerEvent);
		expect(controller.toolbar.dragging).toBe(true);
		controller.handlePointerUp({
			pointerId: 1
		} as PointerEvent);

		controller.toolbar = {
			...controller.toolbar,
			position: {
				x: 400,
				y: 24
			}
		};
		controller.resetToolbarPosition();
		expect(controller.toolbar.position).toEqual({ x: 8, y: 666 });

		controller.setBlockPageInteractions(false);
		expect(readStoredSettings(DEFAULT_NOTES_SETTINGS)).toMatchObject({
			blockPageInteractions: false,
			outputMode: 'compact',
			pauseAnimations: true,
			clearOnCopy: true,
			includeComponentContext: true,
			includeComputedStyles: true
		});

		controller.destroy();
	});

	it('resets to saved placement when no explicit toolbar prop is active', () => {
		writeStoredToolbarPlacement('/', {
			mode: 'preset',
			preset: 'top-center',
			coordinates: getToolbarCoordinatesForPreset('top-center', false)
		});

		const controller = new CopyOpenController({ pageSessionKey: '/' });
		controller.setToolbarPosition('bottom-left');

		controller.toolbar = {
			...controller.toolbar,
			position: {
				x: 300,
				y: 100
			}
		};
		controller.resetToolbarPosition();

		expect(controller.toolbarPositionPreset).toBe('bottom-left');
		expect(controller.toolbar.position).toEqual(
			getToolbarCoordinatesForPreset('bottom-left', false)
		);

		controller.syncPersistedProps({});
		controller.toolbar = {
			...controller.toolbar,
			position: {
				x: 520,
				y: 240
			}
		};
		controller.resetToolbarPosition();

		expect(controller.toolbarPositionPreset).toBe('bottom-left');
		expect(controller.toolbar.position).toEqual(
			getToolbarCoordinatesForPreset('bottom-left', false)
		);
		controller.destroy();
	});

	it('reanchors preset toolbar positions on viewport resize', () => {
		const controller = new CopyOpenController();
		controller.syncPersistedProps({
			toolbarPosition: 'bottom-right'
		});

		expect(controller.toolbar.position).toEqual({ x: 1216, y: 666 });

		setViewport(960, 540);
		controller.handleViewportChange();

		expect(controller.toolbar.position).toEqual({ x: 896, y: 486 });
		controller.destroy();
	});

	it('preserves preset anchors when toggling the toolbar open and closed', () => {
		const controller = new CopyOpenController();
		const scenarios = [
			{
				position: 'bottom-left' as const,
				measure: (x: number, expanded: boolean) => x
			},
			{
				position: 'bottom-center' as const,
				measure: (x: number, expanded: boolean) =>
					x + (expanded ? EXPANDED_TOOLBAR_WIDTH : COLLAPSED_TOOLBAR_SIZE) / 2
			},
			{
				position: 'bottom-right' as const,
				measure: (x: number, expanded: boolean) =>
					x + (expanded ? EXPANDED_TOOLBAR_WIDTH : COLLAPSED_TOOLBAR_SIZE)
			}
		];

		for (const scenario of scenarios) {
			controller.syncPersistedProps({
				toolbarPosition: scenario.position
			});

			const collapsedPosition = { ...controller.toolbar.position };
			const collapsedAnchor = scenario.measure(collapsedPosition.x, false);

			controller.toggleToolbar();
			expect(scenario.measure(controller.toolbar.position.x, true)).toBe(collapsedAnchor);

			controller.closeToolbar();
			expect(controller.toolbar.position).toEqual(collapsedPosition);
		}

		controller.destroy();
	});

	it('supports dragging the toolbar in both collapsed and expanded states', async () => {
		const collapsedController = new CopyOpenController();
		const collapsedHandle = createToolbarHandle(COLLAPSED_TOOLBAR_SIZE, COLLAPSED_TOOLBAR_SIZE);

		collapsedController.handleToolbarPointerDown({
			button: 0,
			pointerId: 1,
			clientX: collapsedController.toolbar.position.x + 26,
			clientY: collapsedController.toolbar.position.y + 26,
			currentTarget: collapsedHandle,
			preventDefault: vi.fn()
		} as unknown as PointerEvent);
		await collapsedController.handlePointerMove({
			pointerId: 1,
			clientX: 400,
			clientY: 300
		} as PointerEvent);
		expect(collapsedController.toolbar.position).toEqual({ x: 374, y: 274 });
		collapsedController.handlePointerUp({
			pointerId: 1
		} as PointerEvent);
		expect(collapsedController.toolbar.dragging).toBe(false);
		collapsedController.destroy();

		const expandedController = new CopyOpenController();
		expandedController.toggleToolbar();
		const expandedHandle = createToolbarHandle(EXPANDED_TOOLBAR_WIDTH, COLLAPSED_TOOLBAR_SIZE);

		expandedController.handleToolbarPointerDown({
			button: 0,
			pointerId: 2,
			clientX: expandedController.toolbar.position.x + EXPANDED_TOOLBAR_WIDTH / 2,
			clientY: expandedController.toolbar.position.y + 26,
			currentTarget: expandedHandle,
			preventDefault: vi.fn()
		} as unknown as PointerEvent);
		await expandedController.handlePointerMove({
			pointerId: 2,
			clientX: 600,
			clientY: 320
		} as PointerEvent);
		expect(expandedController.toolbar.position).toEqual({ x: 467, y: 294 });
		expandedController.handlePointerUp({
			pointerId: 2
		} as PointerEvent);
		expect(expandedController.toolbar.dragging).toBe(false);
		expandedController.destroy();
	});
});
