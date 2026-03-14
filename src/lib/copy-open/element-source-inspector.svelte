<script lang="ts">
	import { onDestroy } from 'svelte';

	import { CopyOpenController } from './copy-open.svelte';
	import InspectorTool from './components/inspector-tool.svelte';
	import HoverCard from './components/hover-card.svelte';
	import NoteComposer from './components/note-composer.svelte';
	import NoteMarkers from './components/note-markers.svelte';
	import type { InspectorProps } from './types';
	import { buildMarkerOutlineVars } from './utils/notes';

	let {
		workspaceRoot = null,
		selector = null,
		vscodeScheme = 'vscode',
		openSourceOnClick = true
	}: InspectorProps = $props();

	const controller = new CopyOpenController();
	const getInspectorThemeStyle = (markerColor: string) => {
		const outline = buildMarkerOutlineVars(markerColor);
		return [
			`--inspector-marker-color:${markerColor}`,
			`--inspector-marker-foreground:${outline.foreground}`,
			`--inspector-outline-border:${outline.border}`,
			`--inspector-outline-bg:${outline.background}`,
			`--inspector-outline-inner:${outline.inner}`
		].join(';');
	};

	$effect(() => {
		controller.updateOptions({
			workspaceRoot,
			selector,
			vscodeScheme,
			openSourceOnClick
		});
	});

	onDestroy(() => {
		controller.destroy();
	});
</script>

<svelte:window
	onclickcapture={controller.handleClick}
	onkeydown={controller.handleKeyDown}
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
		notes={controller.notes}
		settings={controller.settings}
		toolbar={controller.toolbar}
		onCloseToolbar={controller.closeToolbar}
		onCopyNotes={controller.copyNotes}
		onDeleteAllCancel={controller.cancelDeleteAll}
		onDeleteAllConfirm={controller.confirmDeleteAll}
		onDeleteAllRequest={controller.requestDeleteAll}
		onSetBlockPageInteractions={controller.setBlockPageInteractions}
		onSetMarkerColor={controller.setMarkerColor}
		onToggle={controller.toggle}
		onToggleNotesVisibility={controller.toggleNotesVisibility}
		onToggleSettings={controller.toggleSettings}
		onToggleThemeMode={controller.toggleThemeMode}
		onToggleToolbar={controller.toggleToolbar}
		onToolbarPointerDown={controller.handleToolbarPointerDown}
	/>

	<NoteMarkers
		activeNoteId={controller.activeNoteId}
		notes={controller.renderedNotes}
		onOpenNote={controller.openNote}
		visible={controller.toolbar.notesVisible}
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
		<HoverCard
			hoverInfo={controller.hoverInfo}
			onOpen={controller.open}
		/>
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
		--inspector-text-muted: rgba(255, 255, 255, 0.56);
		--inspector-text-subtle: rgba(255, 255, 255, 0.35);
		--inspector-toolbar-hover: rgba(255, 255, 255, 0.06);
		--inspector-surface-soft: rgba(255, 255, 255, 0.03);
		--inspector-kbd-bg: rgba(255, 255, 255, 0.05);
		--inspector-kbd-border: rgba(255, 255, 255, 0.12);
		--inspector-kbd-text: rgba(255, 255, 255, 0.8);
		--inspector-shadow-toolbar:
			0 18px 34px rgba(0, 0, 0, 0.18),
			0 12px 22px rgba(0, 0, 0, 0.14);
		--inspector-shadow-panel:
			0 20px 40px rgba(0, 0, 0, 0.2),
			0 12px 20px rgba(0, 0, 0, 0.12);
		--inspector-shadow-composer:
			0 18px 34px rgba(0, 0, 0, 0.2),
			0 10px 18px rgba(0, 0, 0, 0.14);
		--inspector-shadow-overlay: 0 12px 22px rgba(0, 0, 0, 0.14);
		--inspector-shadow-marker: 0 4px 10px rgba(0, 0, 0, 0.08);
		--inspector-marker-border: rgba(255, 255, 255, 0.92);
		--inspector-checkbox-border: rgba(255, 255, 255, 0.18);
		--inspector-checkbox-bg: rgba(255, 255, 255, 0.03);
		--inspector-checkbox-checked-bg: rgba(255, 255, 255, 0.94);
		--inspector-checkbox-check: #111111;
	}

	.inspector-root.theme-light {
		--inspector-toolbar-surface: rgba(255, 255, 255, 0.98);
		--inspector-panel-surface: rgba(247, 246, 242, 0.98);
		--inspector-overlay-surface: rgba(255, 255, 255, 0.98);
		--inspector-composer-surface: rgba(255, 255, 255, 0.985);
		--inspector-input-surface: rgba(242, 241, 237, 1);
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
			0 18px 34px rgba(15, 23, 42, 0.08),
			0 10px 20px rgba(15, 23, 42, 0.06);
		--inspector-shadow-panel:
			0 20px 40px rgba(15, 23, 42, 0.08),
			0 10px 18px rgba(15, 23, 42, 0.06);
		--inspector-shadow-composer:
			0 16px 28px rgba(15, 23, 42, 0.1),
			0 8px 16px rgba(15, 23, 42, 0.06);
		--inspector-shadow-overlay: 0 12px 22px rgba(15, 23, 42, 0.08);
		--inspector-shadow-marker: 0 4px 10px rgba(15, 23, 42, 0.1);
		--inspector-marker-border: rgba(15, 23, 42, 0.18);
		--inspector-checkbox-border: rgba(15, 23, 42, 0.14);
		--inspector-checkbox-bg: rgba(255, 255, 255, 0.72);
		--inspector-checkbox-checked-bg: #17181c;
		--inspector-checkbox-check: #ffffff;
	}
</style>
