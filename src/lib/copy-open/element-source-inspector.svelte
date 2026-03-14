<script lang="ts">
	import { onDestroy } from 'svelte';

	import { CopyOpenController } from './copy-open.svelte';
	import InspectorTool from './components/inspector-tool.svelte';
	import HoverCard from './components/hover-card.svelte';
	import NoteComposer from './components/note-composer.svelte';
	import NoteMarkers from './components/note-markers.svelte';
	import type { InspectorProps } from './types';

	let {
		workspaceRoot = null,
		selector = null,
		vscodeScheme = 'vscode',
		openSourceOnClick = true
	}: InspectorProps = $props();

	const controller = new CopyOpenController();

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
