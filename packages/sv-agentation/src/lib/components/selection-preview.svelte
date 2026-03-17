<script lang="ts">
	import type { SelectionPreviewProps } from '../internal/component-props';

	let { selectionPreview, dragSelection }: SelectionPreviewProps = $props();
</script>

{#if selectionPreview}
	{#each selectionPreview.rects as rect, index (`group-${index}`)}
		<div
			aria-hidden="true"
			class="selection-rect dashed"
			data-inspector-ui
			style={`left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;`}
		></div>
	{/each}
{/if}

{#if dragSelection}
	<div
		aria-hidden="true"
		class="drag-box"
		data-inspector-ui
		style={`left:${dragSelection.left}px;top:${dragSelection.top}px;width:${dragSelection.width}px;height:${dragSelection.height}px;`}
	></div>

	{#each dragSelection.highlightRects as rect, index (`drag-${index}`)}
		<div
			aria-hidden="true"
			class="selection-rect dashed"
			data-inspector-ui
			style={`left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;`}
		></div>
	{/each}
{/if}

<style>
	.selection-rect,
	.drag-box {
		position: fixed;
		z-index: 9997;
		box-sizing: border-box;
		pointer-events: none;
	}

	.selection-rect.dashed,
	.drag-box {
		border: 2px dashed var(--inspector-group-outline-border);
		border-radius: 4px;
		background: var(--inspector-group-outline-bg);
		box-shadow:
			0 0 0 1px color-mix(in srgb, var(--inspector-group-color) 10%, transparent),
			inset 0 0 0 1px color-mix(in srgb, var(--inspector-group-color) 12%, transparent);
	}

	.drag-box {
		background: color-mix(in srgb, var(--inspector-group-color) 10%, transparent);
	}
</style>
