<script lang="ts">
	import { scale } from 'svelte/transition';

	import type { RenderedInspectorNote } from '../../types';
	import type { InspectorToolbarPreviewProps } from '../../internal/component-props';

	let {
		notes,
		onOpenNote,
		panelElement = $bindable<HTMLDivElement | null>(null),
		placement = 'above',
		style = ''
	}: {
		panelElement?: HTMLDivElement | null;
		placement?: 'above' | 'below';
		style?: string;
	} & InspectorToolbarPreviewProps = $props();

	const panelTransition = {
		duration: 180,
		start: 0.96,
		opacity: 0
	};

	const previewPanelWidth = '320px';

	const getSavedLabel = (count: number) => `${count} ${count === 1 ? 'note' : 'notes'}`;

	const getNoteKindLabel = (note: RenderedInspectorNote) => {
		switch (note.kind) {
			case 'element':
				return 'Element';
			case 'text':
				return 'Text';
			case 'group':
				return 'Group';
			case 'area':
				return 'Area';
		}
	};

	const handleOpenNote = async (event: MouseEvent, noteId: string) => {
		event.preventDefault();
		event.stopPropagation();
		await onOpenNote(noteId);
	};
</script>

<div
	bind:this={panelElement}
	class:panel-below={placement === 'below'}
	class="panel preview-panel"
	data-inspector-ui
	in:scale={panelTransition}
	out:scale={{ ...panelTransition, duration: 140 }}
	style={`--preview-panel-width:${previewPanelWidth};${style}`}
>
	<div class="preview-head" data-inspector-ui>
		<h3 class="preview-title" data-inspector-ui>Preview Notes</h3>
		<span class="preview-count" data-inspector-ui>{getSavedLabel(notes.length)}</span>
	</div>

	{#if notes.length === 0}
		<div class="preview-empty" data-inspector-ui>
			<p data-inspector-ui>No notes on this page yet.</p>
		</div>
	{:else}
		<div class="preview-list" data-inspector-ui>
			{#each notes as note, index (note.id)}
				<button
					class="preview-item"
					data-inspector-ui
					title={note.targetSummary}
					type="button"
					onclick={(event) => handleOpenNote(event, note.id)}
				>
					<div class="preview-item-head" data-inspector-ui>
						<span class="preview-item-index" data-inspector-ui>Note {index + 1}</span>
						<div class="preview-item-meta" data-inspector-ui>
							<span class="preview-badge" data-inspector-ui>{getNoteKindLabel(note)}</span>
							{#if note.resolution !== 'resolved'}
								<span class="preview-badge preview-badge-warning" data-inspector-ui>
									{note.resolution}
								</span>
							{/if}
						</div>
					</div>

					<div class="preview-item-title" data-inspector-ui>{note.targetSummary}</div>
					<div class="preview-item-body" data-inspector-ui>{note.note}</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.panel {
		position: absolute;
		bottom: calc(100% + 10px);
		left: var(--toolbar-panel-offset-x, 0px);
		max-height: var(--toolbar-panel-max-height, none);
		overflow: hidden;
		transform-origin: left bottom;
		pointer-events: auto;
	}

	.panel.panel-below {
		top: calc(100% + 10px);
		bottom: auto;
		transform-origin: left top;
	}

	.preview-panel {
		display: grid;
		gap: 12px;
		width: min(var(--preview-panel-width), calc(100vw - 16px));
		padding: 12px;
		border: 1px solid var(--inspector-border);
		border-radius: 24px;
		background: var(--inspector-panel-surface);
		box-shadow: var(--inspector-shadow-panel);
		backdrop-filter: blur(18px);
	}

	.preview-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.preview-title {
		margin: 0;
		font-size: 0.82rem;
		font-weight: 520;
		color: var(--inspector-text-primary);
	}

	.preview-count {
		color: var(--inspector-text-muted);
		font-size: 0.76rem;
		font-weight: 500;
	}

	.preview-empty {
		display: grid;
		place-items: center;
		min-height: 120px;
		border: 1px dashed var(--inspector-border);
		border-radius: 18px;
		color: var(--inspector-text-muted);
		font-size: 0.82rem;
	}

	.preview-empty p {
		margin: 0;
	}

	.preview-list {
		display: grid;
		gap: 10px;
		max-height: min(430px, calc(var(--toolbar-panel-max-height, 430px) - 56px));
		padding-right: 2px;
		overflow-y: auto;
		overscroll-behavior: contain;
		scrollbar-color: color-mix(in srgb, var(--inspector-text-muted) 30%, transparent) transparent;
		scrollbar-width: thin;
		border-radius: 10px;
	}

	.preview-list::-webkit-scrollbar {
		width: 8px;
	}

	.preview-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.preview-list::-webkit-scrollbar-thumb {
		border: 2px solid transparent;
		border-radius: 999px;
		background: color-mix(in srgb, var(--inspector-text-muted) 24%, transparent);
		background-clip: padding-box;
	}

	.preview-item {
		display: grid;
		gap: 8px;
		width: 100%;
		padding: 12px;
		border: 1px solid var(--inspector-border);
		border-radius: 15px;
		background: color-mix(in srgb, var(--inspector-surface-soft) 92%, transparent);
		color: inherit;
		text-align: left;
		cursor: pointer;
		transition:
			transform 180ms ease,
			border-color 180ms ease,
			background 180ms ease,
			box-shadow 180ms ease;
	}

	.preview-item:hover {
		border-color: color-mix(in srgb, var(--inspector-marker-color) 22%, var(--inspector-border));
		background: color-mix(in srgb, var(--inspector-toolbar-hover) 72%, transparent);
		/* box-shadow: 0 12px 20px color-mix(in srgb, #000000 10%, transparent); */
	}

	.preview-item-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.preview-item-index {
		color: var(--inspector-text-muted);
		font-size: 0.76rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.preview-item-meta {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: flex-end;
		gap: 6px;
	}

	.preview-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 20px;
		padding: 0 8px;
		border: 1px solid var(--inspector-border);
		border-radius: 999px;
		color: var(--inspector-text-muted);
		font-size: 0.68rem;
		font-weight: 600;
		line-height: 1;
		text-transform: uppercase;
	}

	.preview-badge-warning {
		border-color: color-mix(in srgb, var(--inspector-danger) 28%, transparent);
		color: var(--inspector-danger);
	}

	.preview-item-title {
		overflow: hidden;
		color: var(--inspector-text-primary);
		font-size: 0.84rem;
		font-weight: 540;
		line-height: 1.3;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.preview-item-body {
		display: -webkit-box;
		overflow: hidden;
		color: var(--inspector-text-secondary);
		font-size: 0.82rem;
		line-clamp: 3;
		line-height: 1.45;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
	}

	@media (max-width: 640px) {
		.preview-panel {
			padding: 10px;
			border-radius: 20px;
		}

		.preview-item {
			padding: 10px;
			border-radius: 18px;
		}
	}
</style>
