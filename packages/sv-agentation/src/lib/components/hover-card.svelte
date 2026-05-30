<script lang="ts">
	import { fade, scale } from 'svelte/transition';

	import type { HoverCardProps } from '../internal/component-props';
	import { toInteractionHostPoint } from '../utils/dom';

	let { hoverInfo, onOpen, openShortcut, hosted = false }: HoverCardProps = $props();

	const handleOpenClick = (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		onOpen();
	};

	const getOpenTitle = () =>
		openShortcut ? `Open in VS Code (${openShortcut})` : 'Open in VS Code';

	const getHostAdjustedStyle = (left: number, top: number, width?: number, height?: number) => {
		const nextPosition = toInteractionHostPoint(left, top, hoverInfo?.interactionHost ?? null);
		return [
			`left:${nextPosition.left}px`,
			`top:${nextPosition.top}px`,
			...(width === undefined ? [] : [`width:${width}px`]),
			...(height === undefined ? [] : [`height:${height}px`])
		].join(';');
	};
</script>

{#if hoverInfo}
	<div
		aria-hidden="true"
		class:hosted-layer={hosted}
		class="hover-outline"
		data-inspector-ui
		style={getHostAdjustedStyle(
			hoverInfo.left,
			hoverInfo.top,
			hoverInfo.width,
			hoverInfo.height
		)}
		in:fade={{ duration: 100 }}
		out:fade={{ duration: 90 }}
	></div>

	<div
		class:hosted-layer={hosted}
		class="hover-badge"
		data-inspector-ui
		style={getHostAdjustedStyle(hoverInfo.cardLeft, hoverInfo.cardTop)}
		in:scale={{ duration: 120, start: 0.97 }}
		out:fade={{ duration: 90 }}
	>
		<span class="hover-label" data-inspector-ui>{hoverInfo.targetLabel}</span>

		<button
			aria-keyshortcuts={openShortcut ?? undefined}
			aria-label="Open in VS Code"
			class="action-button"
			data-inspector-ui
			disabled={!hoverInfo.canOpen}
			title={getOpenTitle()}
			type="button"
			onclick={handleOpenClick}
		>
			<span>open</span>
			{#if openShortcut}
				<kbd>{openShortcut}</kbd>
			{/if}
		</button>
	</div>
{/if}

<style>
	.hover-outline {
		position: fixed;
		z-index: 9998;
		box-sizing: border-box;
		border: 1px solid var(--inspector-outline-border);
		border-radius: 6px;
		background: var(--inspector-outline-bg);
		box-shadow: 0 0 0 1px var(--inspector-outline-inner) inset;
		pointer-events: none;
		transition:
			left 180ms cubic-bezier(0.22, 1, 0.36, 1),
			top 180ms cubic-bezier(0.22, 1, 0.36, 1),
			width 180ms cubic-bezier(0.22, 1, 0.36, 1),
			height 180ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.hover-outline.hosted-layer {
		position: absolute;
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
		pointer-events: auto;
		transition:
			left 180ms cubic-bezier(0.22, 1, 0.36, 1),
			top 180ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.hover-badge.hosted-layer {
		position: absolute;
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
