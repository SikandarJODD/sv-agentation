<script lang="ts">
	import { onDestroy } from 'svelte';

	import { CopyOpenController } from './copy-open.svelte';
	import InspectorTool from './components/inspector-tool.svelte';
	import HoverCard from './components/hover-card.svelte';
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
	onresize={controller.handleViewportChange}
	onscroll={controller.handleViewportChange}
/>

<InspectorTool
	enabled={controller.enabled}
	menuOpen={controller.menuOpen}
	onMenuToggle={controller.toggleMenu}
	onPositionChange={controller.setPosition}
	onToggle={controller.toggle}
	position={controller.position}
/>

<HoverCard
	copied={controller.copied}
	hoverInfo={controller.hoverInfo}
	onCopy={controller.copy}
	onOpen={controller.open}
/>
