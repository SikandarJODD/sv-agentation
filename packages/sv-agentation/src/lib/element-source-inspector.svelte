<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';

	import { CopyOpenController } from './copy-open.svelte.ts';
	import InspectorTool from './components/inspector-tool.svelte';
	import HoverCard from './components/hover-card.svelte';
	import NoteComposer from './components/note-composer.svelte';
	import NoteMarkers from './components/note-markers.svelte';
	import SelectionPreview from './components/selection-preview.svelte';
	import type { InspectorPosition, InspectorProps, OutputMode } from './types';
	import { DEFAULT_INSPECTOR_POSITION } from './utils/position';
	import {
		buildMarkerOutlineVars,
		DEFAULT_DELETE_ALL_DELAY_MS,
		DEFAULT_NOTES_SETTINGS
	} from './utils/notes';
	import { observePathnameChanges } from './internal/controller-browser';

	let rawProps: InspectorProps = $props();

	type PersistedPropSnapshot = {
		toolbarPosition?: InspectorPosition;
		outputMode?: OutputMode;
		pauseAnimations?: boolean;
		clearOnCopy?: boolean;
		includeComponentContext?: boolean;
		includeComputedStyles?: boolean;
	};
	const hasSamePersistedProps = (current: PersistedPropSnapshot, next: PersistedPropSnapshot) =>
		current.toolbarPosition === next.toolbarPosition &&
		current.outputMode === next.outputMode &&
		current.pauseAnimations === next.pauseAnimations &&
		current.clearOnCopy === next.clearOnCopy &&
		current.includeComponentContext === next.includeComponentContext &&
		current.includeComputedStyles === next.includeComputedStyles;

	const hasExplicitProp = <Key extends keyof InspectorProps>(key: Key) =>
		Object.prototype.hasOwnProperty.call(rawProps, key);
	const getRuntimeOptions = (resolvedPageSessionKey: string | null) => ({
		workspaceRoot: rawProps.workspaceRoot ?? null,
		pageSessionKey: resolvedPageSessionKey,
		selector: rawProps.selector ?? null,
		vscodeScheme: rawProps.vscodeScheme ?? 'vscode',
		openSourceOnClick: rawProps.openSourceOnClick ?? true,
		deleteAllDelayMs: rawProps.deleteAllDelayMs ?? DEFAULT_DELETE_ALL_DELAY_MS,
		copyToClipboard: rawProps.copyToClipboard ?? true,
		onAnnotationAdd: rawProps.onAnnotationAdd,
		onAnnotationUpdate: rawProps.onAnnotationUpdate,
		onAnnotationDelete: rawProps.onAnnotationDelete,
		onAnnotationsClear: rawProps.onAnnotationsClear,
		onCopy: rawProps.onCopy
	});
	const getExplicitPersistedProps = (): PersistedPropSnapshot => {
		const next: PersistedPropSnapshot = {};

		if (hasExplicitProp('toolbarPosition')) {
			next.toolbarPosition = rawProps.toolbarPosition ?? DEFAULT_INSPECTOR_POSITION;
		}
		if (hasExplicitProp('outputMode')) {
			next.outputMode = rawProps.outputMode ?? DEFAULT_NOTES_SETTINGS.outputMode;
		}
		if (hasExplicitProp('pauseAnimations')) {
			next.pauseAnimations = rawProps.pauseAnimations ?? DEFAULT_NOTES_SETTINGS.pauseAnimations;
		}
		if (hasExplicitProp('clearOnCopy')) {
			next.clearOnCopy = rawProps.clearOnCopy ?? DEFAULT_NOTES_SETTINGS.clearOnCopy;
		}
		if (hasExplicitProp('includeComponentContext')) {
			next.includeComponentContext =
				rawProps.includeComponentContext ?? DEFAULT_NOTES_SETTINGS.includeComponentContext;
		}
		if (hasExplicitProp('includeComputedStyles')) {
			next.includeComputedStyles =
				rawProps.includeComputedStyles ?? DEFAULT_NOTES_SETTINGS.includeComputedStyles;
		}

		return next;
	};

	const controller = new CopyOpenController();
	let autoPageSessionKey = $state<string | null>(null);
	let lastExplicitPersistedProps: PersistedPropSnapshot = {};
	let lastPersistedPageSessionKey: string | null = null;
	const getInspectorThemeStyle = (markerColor: string) => {
		const outline = buildMarkerOutlineVars(markerColor);
		return [
			`--inspector-marker-color:${markerColor}`,
			`--inspector-marker-foreground:${outline.foreground}`,
			`--inspector-outline-border:${outline.border}`,
			`--inspector-outline-bg:${outline.background}`,
			`--inspector-outline-inner:${outline.inner}`,
			`--inspector-group-color:${markerColor}`,
			`--inspector-group-outline-border:color-mix(in srgb, ${markerColor} 72%, transparent)`,
			`--inspector-group-outline-bg:color-mix(in srgb, ${markerColor} 6%, transparent)`
		].join(';');
	};

	onMount(() => {
		if (typeof window === 'undefined') return;

		autoPageSessionKey = window.location.pathname || '/';
		return observePathnameChanges((pathname) => {
			autoPageSessionKey = pathname || '/';
		});
	});

	$effect.pre(() => {
		const effectivePageSessionKey = rawProps.pageSessionKey ?? autoPageSessionKey;
		const nextOptions = getRuntimeOptions(effectivePageSessionKey);
		const nextExplicitPersistedProps = getExplicitPersistedProps();
		const shouldSyncPersistedProps =
			!hasSamePersistedProps(lastExplicitPersistedProps, nextExplicitPersistedProps) ||
			lastPersistedPageSessionKey !== effectivePageSessionKey;

		lastExplicitPersistedProps = nextExplicitPersistedProps;
		lastPersistedPageSessionKey = effectivePageSessionKey;

		// This effect should react to incoming props only, not controller state read during sync.
		untrack(() => {
			controller.updateOptions(nextOptions);
			if (shouldSyncPersistedProps) {
				controller.syncPersistedProps(nextExplicitPersistedProps);
			}
		});
	});

	onDestroy(() => {
		controller.destroy();
	});
</script>

<svelte:window
	onblur={controller.handleWindowBlur}
	onclickcapture={controller.handleClick}
	onkeydown={controller.handleKeyDown}
	onkeyup={controller.handleKeyUp}
	onmousedowncapture={controller.handleMouseDownCapture}
	onmouseupcapture={controller.handleMouseUpCapture}
	onpointermove={controller.handlePointerMove}
	onpointerup={controller.handlePointerUp}
	onpointercancel={controller.handlePointerUp}
	onresize={controller.handleViewportChange}
	onscroll={controller.handleViewportChange}
/>

<div
	class:theme-dark={controller.settings.themeMode === 'dark'}
	class:theme-light={controller.settings.themeMode === 'light'}
	class="inspector-root"
	data-inspector-ui
	style={getInspectorThemeStyle(controller.settings.markerColor)}
>
	<InspectorTool
		active={controller.enabled}
		deleteAllState={controller.deleteAllState}
		notes={controller.notes}
		settings={controller.settings}
		toolbar={controller.toolbar}
		toolbarDragEnabled
		onCloseToolbar={controller.closeToolbar}
		onCopyNotes={controller.copyNotes}
		onDeleteAll={controller.requestDeleteAll}
		onSetBlockPageInteractions={controller.setBlockPageInteractions}
		onSetClearOnCopy={controller.setClearOnCopy}
		onSetIncludeComponentContext={controller.setIncludeComponentContext}
		onSetIncludeComputedStyles={controller.setIncludeComputedStyles}
		onSetMarkerColor={controller.setMarkerColor}
		onSetOutputMode={controller.setOutputMode}
		onSetPauseAnimations={controller.setPauseAnimations}
		onSetToolbarPosition={controller.setToolbarPosition}
		onToggle={controller.toggle}
		onToggleNotesVisibility={controller.toggleNotesVisibility}
		onToggleSettings={controller.toggleSettings}
		onToggleThemeMode={controller.toggleThemeMode}
		onToggleToolbar={controller.toggleToolbar}
		onToolbarPointerDown={controller.handleToolbarPointerDown}
		toolbarPosition={controller.toolbarPositionPreset}
	/>

	<NoteMarkers
		activeNoteId={controller.activeNoteId}
		composerNoteId={controller.composer?.noteId ?? null}
		notes={controller.renderedNotes}
		onOpenNote={controller.openNote}
		visible={controller.toolbar.notesVisible}
	/>

	<SelectionPreview
		dragSelection={controller.dragSelection}
		selectionPreview={controller.selectionPreview}
	/>

	<NoteComposer
		composer={controller.composer}
		onCancel={controller.closeComposer}
		onDelete={controller.deleteNote}
		onInput={controller.updateNoteDraft}
		onSubmit={controller.saveComposer}
		value={controller.noteDraft}
	/>

	{#if controller.enabled && !controller.composer}
		<HoverCard hoverInfo={controller.hoverInfo} onOpen={controller.open} />
	{/if}
</div>

<style>
	.inspector-root {
		--inspector-accent: #0a84ff;
		--inspector-accent-text: #45a3ff;
		--inspector-accent-soft: rgba(10, 132, 255, 0.22);
		--inspector-accent-border: rgba(69, 163, 255, 0.3);
		--inspector-success: #14ce4c;
		--inspector-success-soft: rgba(20, 206, 76, 0.12);
		--inspector-danger: #ff7b73;
		--inspector-danger-soft: rgba(255, 69, 58, 0.12);
	}

	.inspector-root.theme-dark {
		--inspector-toolbar-surface: rgba(28, 28, 30, 0.98);
		--inspector-panel-surface: rgba(29, 29, 31, 0.98);
		--inspector-overlay-surface: rgba(28, 28, 30, 0.98);
		--inspector-composer-surface: rgba(29, 29, 31, 0.985);
		--inspector-input-surface: rgba(37, 37, 40, 1);
		--inspector-composer-input-surface: rgba(37, 37, 40, 1);
		--inspector-border: rgba(255, 255, 255, 0.08);
		--inspector-composer-border: rgba(255, 255, 255, 0.08);
		--inspector-border-strong: rgba(255, 255, 255, 0.12);
		--inspector-divider: rgba(255, 255, 255, 0.1);
		--inspector-text-primary: rgba(255, 255, 255, 0.94);
		--inspector-text-secondary: rgba(255, 255, 255, 0.78);
		--inspector-text-muted: rgba(255, 255, 255, 0.80);
		--inspector-text-subtle: rgba(255, 255, 255, 0.35);
		--inspector-toolbar-hover: rgba(255, 255, 255, 0.06);
		--inspector-surface-soft: rgba(255, 255, 255, 0.03);
		--inspector-kbd-bg: rgba(255, 255, 255, 0.05);
		--inspector-kbd-border: rgba(255, 255, 255, 0.12);
		--inspector-kbd-text: rgba(255, 255, 255, 0.8);
		--inspector-shadow-toolbar: 0 18px 34px rgba(0, 0, 0, 0.18), 0 12px 22px rgba(0, 0, 0, 0.14);
		--inspector-shadow-panel: 0 20px 40px rgba(0, 0, 0, 0.2), 0 12px 20px rgba(0, 0, 0, 0.12);
		--inspector-shadow-composer: 0 18px 34px rgba(0, 0, 0, 0.2), 0 10px 18px rgba(0, 0, 0, 0.14);
		--inspector-shadow-overlay: 0 12px 22px rgba(0, 0, 0, 0.14);
		--inspector-shadow-marker: 0 4px 10px rgba(0, 0, 0, 0.08);
		--inspector-marker-border: rgba(255, 255, 255, 0.52);
		--inspector-checkbox-border: rgba(255, 255, 255, 0.18);
		--inspector-checkbox-bg: rgba(255, 255, 255, 0.03);
		--inspector-checkbox-checked-bg: rgba(255, 255, 255, 0.94);
		--inspector-checkbox-check: #111111;
	}

	.inspector-root.theme-light {
		--inspector-toolbar-surface: rgba(255, 255, 255, 1);
		--inspector-panel-surface: rgba(255, 255, 255, 1);
		--inspector-overlay-surface: rgba(255, 255, 255, 0.99);
		--inspector-composer-surface: rgba(255, 255, 255, 0.985);
		--inspector-input-surface: rgba(248, 250, 252, 1);
		--inspector-composer-input-surface: rgba(255, 255, 255, 1);
		--inspector-border: rgba(15, 23, 42, 0.08);
		--inspector-composer-border: rgba(15, 23, 42, 0.12);
		--inspector-border-strong: rgba(15, 23, 42, 0.14);
		--inspector-divider: rgba(15, 23, 42, 0.1);
		--inspector-text-primary: #17181c;
		--inspector-text-secondary: rgba(23, 24, 28, 0.78);
		--inspector-text-muted: rgba(82, 87, 97, 0.78);
		--inspector-text-subtle: rgba(82, 87, 97, 0.48);
		--inspector-toolbar-hover: rgba(15, 23, 42, 0.06);
		--inspector-surface-soft: rgba(15, 23, 42, 0.03);
		--inspector-kbd-bg: rgba(15, 23, 42, 0.05);
		--inspector-kbd-border: rgba(15, 23, 42, 0.12);
		--inspector-kbd-text: rgba(15, 23, 42, 0.78);
		--inspector-shadow-toolbar:
			0 18px 34px rgba(15, 23, 42, 0.08), 0 10px 20px rgba(15, 23, 42, 0.06);
		--inspector-shadow-panel:
			0 20px 40px rgba(15, 23, 42, 0.08), 0 10px 18px rgba(15, 23, 42, 0.06);
		--inspector-shadow-composer:
			0 16px 28px rgba(15, 23, 42, 0.1), 0 8px 16px rgba(15, 23, 42, 0.06);
		--inspector-shadow-overlay: 0 12px 22px rgba(15, 23, 42, 0.08);
		--inspector-shadow-marker: 0 4px 10px rgba(15, 23, 42, 0.1);
		--inspector-marker-border: rgba(15, 23, 42, 0.18);
		--inspector-checkbox-border: rgba(15, 23, 42, 0.14);
		--inspector-checkbox-bg: rgba(255, 255, 255, 0.72);
		--inspector-checkbox-checked-bg: #17181c;
		--inspector-checkbox-check: #ffffff;
	}
</style>
