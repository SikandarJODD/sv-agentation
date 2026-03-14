<script lang="ts">
	import type { InspectorHoverInfo } from '../types';
	import { formatLocationLabel } from '../utils/source';

	let {
		hoverInfo,
		copied,
		onCopy,
		onOpen
	}: {
		hoverInfo: InspectorHoverInfo | null;
		copied: boolean;
		onCopy: () => Promise<boolean>;
		onOpen: () => boolean;
	} = $props();

	const handleCopyClick = async (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		await onCopy();
	};

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
	></div>

	<div
		class="hover-badge"
		data-inspector-ui
		style={`left:${hoverInfo.cardLeft}px;top:${hoverInfo.cardTop}px;`}
	>
		<div class="hover-bar" data-inspector-ui>
			<div class="hover-summary" data-inspector-ui>
				<span class="component-name" data-inspector-ui>{hoverInfo.componentName ?? 'Unknown'}</span>
				<span aria-hidden="true" class="summary-separator" data-inspector-ui>&bull;</span>
				<span class="location-label" data-inspector-ui>{formatLocationLabel(hoverInfo)}</span>
			</div>

			<div class="hover-actions" data-inspector-ui>
				<button
					aria-keyshortcuts="C"
					aria-label="Copy source details"
					class="action-button"
					data-inspector-ui
					disabled={!hoverInfo.canCopy}
					title="Copy source details (C)"
					type="button"
					onclick={handleCopyClick}
				>
					<span>{copied ? 'Copied' : 'Copy'}</span>
					<kbd>C</kbd>
				</button>

				<div aria-hidden="true" class="action-separator" data-inspector-ui></div>

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
					<span>Open</span>
					<kbd>O</kbd>
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.hover-outline {
		position: fixed;
		z-index: 9998;
		box-sizing: border-box;
		border: 1px solid rgba(251, 146, 60, 0.86);
		border-radius: 0;
		background: rgba(249, 115, 22, 0.08);
		box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.16) inset;
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
		max-width: min(35rem, calc(100vw - 16px));
		border: 1px solid rgba(251, 146, 60, 0.34);
		border-radius: 0;
		background: rgba(49, 24, 7, 0.86);
		color: #ffedd5;
		box-shadow: 0 10px 22px rgba(0, 0, 0, 0.26);
		backdrop-filter: blur(10px);
		transition:
			left 180ms cubic-bezier(0.22, 1, 0.36, 1),
			top 180ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.hover-bar {
		display: flex;
		flex-wrap: nowrap;
		gap: 0.5rem;
		align-items: center;
		justify-content: space-between;
		padding: 0.28rem 0.44rem;
	}

	.hover-summary {
		display: flex;
		flex-wrap: wrap;
		flex: 1;
		gap: 0.28rem;
		align-items: center;
		min-width: 0;
	}

	.component-name {
		font-size: 0.9rem;
		font-weight: 500;
		line-height: 1.1;
		color: #fdba74;
	}

	.summary-separator,
	.location-label {
		font-size: 0.82rem;
		line-height: 1.2;
		color: rgba(255, 237, 213, 0.82);
		word-break: break-word;
	}

	.hover-actions {
		display: flex;
		flex-shrink: 0;
		gap: 0.2rem;
		align-items: center;
		padding: 0.08rem;
		background: rgba(15, 23, 42, 0.1);
	}

	.action-button {
		display: inline-flex;
		gap: 0.28rem;
		align-items: center;
		padding: 0.24rem 0.36rem;
		border: 1px solid transparent;
		border-radius: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 0.74rem;
		line-height: 1;
		cursor: pointer;
	}

	.action-button:hover:not(:disabled) {
		background: rgba(255, 237, 213, 0.08);
	}

	.action-button:disabled {
		opacity: 0.42;
		cursor: not-allowed;
	}

	kbd {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1rem;
		height: 1rem;
		padding: 0 0.2rem;
		border: 1px solid rgba(251, 146, 60, 0.34);
		border-radius: 0;
		background: rgba(120, 53, 15, 0.4);
		color: #fdba74;
		font-size: 0.64rem;
		font-family: 'IBM Plex Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
	}

	.action-separator {
		width: 1px;
		height: 1rem;
		background: rgba(255, 237, 213, 0.1);
	}

	@media (max-width: 640px) {
		.hover-bar {
			flex-wrap: wrap;
			gap: 0.38rem;
			align-items: flex-start;
		}

		.hover-actions {
			width: 100%;
			justify-content: flex-start;
		}
	}
</style>
