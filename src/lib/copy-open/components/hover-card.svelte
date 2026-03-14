<script lang="ts">
	import { fade, scale } from 'svelte/transition';

	import type { InspectorHoverInfo } from '../types';

	let {
		hoverInfo,
		onOpen
	}: {
		hoverInfo: InspectorHoverInfo | null;
		onOpen: () => boolean;
	} = $props();

	const handleOpenClick = (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		onOpen();
	};
</script>

{#if hoverInfo}
	<div
		aria-hidden="true"
		class="hover-outline"
		data-inspector-ui
		style={`left:${hoverInfo.left}px;top:${hoverInfo.top}px;width:${hoverInfo.width}px;height:${hoverInfo.height}px;`}
		in:fade={{ duration: 100 }}
		out:fade={{ duration: 90 }}
	></div>

	<div
		class="hover-badge"
		data-inspector-ui
		style={`left:${hoverInfo.cardLeft}px;top:${hoverInfo.cardTop}px;`}
		in:scale={{ duration: 120, start: 0.97 }}
		out:fade={{ duration: 90 }}
	>
		<span class="hover-label" data-inspector-ui>{hoverInfo.targetLabel}</span>

		<button
			aria-keyshortcuts="O"
			aria-label="Open in VS Code"
			class="action-button"
			data-inspector-ui
			disabled={!hoverInfo.canOpen}
			title="Open in VS Code (O)"
			type="button"
			onclick={handleOpenClick}
		>
			<span>open</span>
			<kbd>o</kbd>
		</button>
	</div>
{/if}

<style>
	.hover-outline {
		position: fixed;
		z-index: 9998;
		box-sizing: border-box;
		border: 1px solid rgba(20, 206, 76, 0.78);
		border-radius: 6px;
		background: rgba(20, 206, 76, 0.06);
		box-shadow: 0 0 0 1px rgba(20, 206, 76, 0.12) inset;
		pointer-events: none;
		transition:
			left 180ms cubic-bezier(0.22, 1, 0.36, 1),
			top 180ms cubic-bezier(0.22, 1, 0.36, 1),
			width 180ms cubic-bezier(0.22, 1, 0.36, 1),
			height 180ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.hover-badge {
		position: fixed;
		z-index: 9999;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		max-width: min(19.5rem, calc(100vw - 16px));
		padding: 6px 8px 6px 10px;
		border: 1px solid var(--inspector-border);
		border-radius: 11px;
		background: var(--inspector-overlay-surface);
		color: var(--inspector-text-primary);
		box-shadow: var(--inspector-shadow-overlay);
		backdrop-filter: blur(16px);
		transition:
			left 180ms cubic-bezier(0.22, 1, 0.36, 1),
			top 180ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.hover-label {
		display: block;
		flex: 1;
		min-width: 0;
		overflow: hidden;
		color: var(--inspector-text-primary);
		font-size: 0.8rem;
		font-style: italic;
		font-weight: 600;
		line-height: 1.15;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.action-button {
		display: inline-flex;
		flex-shrink: 0;
		gap: 0.34rem;
		align-items: center;
		padding: 0 0 0 8px;
		border: none;
		border-left: 1px solid var(--inspector-divider);
		border-radius: 0;
		background: transparent;
		color: var(--inspector-text-secondary);
		font: inherit;
		font-size: 0.72rem;
		line-height: 1;
		cursor: pointer;
		transition:
			color 160ms ease,
			opacity 160ms ease,
			transform 160ms ease;
	}

	.action-button:hover:not(:disabled) {
		color: var(--inspector-text-primary);
		transform: translateY(-0.5px);
	}

	.action-button:disabled {
		opacity: 0.38;
		cursor: not-allowed;
	}

	kbd {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1rem;
		height: 1rem;
		padding: 0 0.2rem;
		border: 1px solid var(--inspector-kbd-border);
		border-radius: 999px;
		background: var(--inspector-kbd-bg);
		color: var(--inspector-kbd-text);
		font-size: 0.64rem;
		font-family: 'IBM Plex Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
	}

	@media (max-width: 640px) {
		.hover-badge {
			max-width: min(17rem, calc(100vw - 12px));
		}
	}
</style>
