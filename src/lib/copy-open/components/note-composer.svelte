<script lang="ts">
	import { scale } from 'svelte/transition';
	import { ChevronRight, Trash2 } from '@lucide/svelte';

	import type { NoteComposerState } from '../types';

	let {
		composer,
		value,
		onCancel,
		onDelete,
		onInput,
		onSubmit
	}: {
		composer: NoteComposerState | null;
		value: string;
		onCancel: () => void;
		onDelete: (noteId: string) => void;
		onInput: (value: string) => void;
		onSubmit: () => boolean;
	} = $props();

	let textareaElement = $state<HTMLTextAreaElement | null>(null);

	$effect(() => {
		if (!composer || !textareaElement) return;
		textareaElement.focus();
		textareaElement.setSelectionRange(textareaElement.value.length, textareaElement.value.length);
	});

	const handleInput = (event: Event) => {
		onInput((event.currentTarget as HTMLTextAreaElement).value);
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
			event.preventDefault();
			onSubmit();
		}
	};

	const handleSubmit = (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		onSubmit();
	};

	const handleDelete = (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		if (!composer?.noteId) return;
		onDelete(composer.noteId);
	};

	const getHasChanges = (composerState: NoteComposerState, nextValue: string) =>
		nextValue.trim() !== composerState.initialValue.trim();

	const getCanSubmit = (composerState: NoteComposerState, nextValue: string) =>
		nextValue.trim().length > 0 && getHasChanges(composerState, nextValue);
</script>

{#if composer}
	<div
		aria-hidden="true"
		class="selected-outline"
		data-inspector-ui
		style={`left:${composer.targetRect.left}px;top:${composer.targetRect.top}px;width:${composer.targetRect.width}px;height:${composer.targetRect.height}px;`}
	></div>

	<button
		aria-label="Active note anchor"
		class="anchor-marker"
		data-inspector-ui
		style={`left:${composer.markerLeft}px;top:${composer.markerTop}px;`}
		type="button"
	>
		<span>+</span>
	</button>

	<div
		class="composer"
		data-inspector-ui
		style={`left:${composer.panelLeft}px;top:${composer.panelTop}px;`}
		in:scale={{ duration: 180, start: 0.94 }}
	>
		<div class="composer-head" data-inspector-ui>
			<div class="target-label" data-inspector-ui>
				<ChevronRight size={14} />
				<span data-inspector-ui>{composer.targetLabel}</span>
			</div>
		</div>

		<textarea
			bind:this={textareaElement}
			class="composer-input"
			data-inspector-ui
			placeholder="what should change?"
			rows="4"
			value={value}
			oninput={handleInput}
			onkeydown={handleKeyDown}
		></textarea>

		<div class="composer-actions" data-inspector-ui>
			{#if composer.noteId}
				<button
					aria-label="Delete note"
					class="delete-button"
					data-inspector-ui
					title="Delete note"
					type="button"
					onclick={handleDelete}
				>
					<Trash2 size={15} />
				</button>
			{/if}

			<button
				aria-disabled={!getHasChanges(composer, value)}
				class:inactive-action={!getHasChanges(composer, value)}
				class="cancel-button"
				data-inspector-ui
				type="button"
				onclick={onCancel}
			>
				Cancel
			</button>
			<button
				class="submit-button"
				data-inspector-ui
				disabled={!getCanSubmit(composer, value)}
				type="button"
				onclick={handleSubmit}
			>
				{composer.noteId ? 'Save' : 'Add'}
			</button>
		</div>
	</div>
{/if}

<style>
	.selected-outline {
		position: fixed;
		z-index: 9996;
		box-sizing: border-box;
		border: 1.5px solid var(--inspector-outline-border);
		border-radius: 4px;
		background: var(--inspector-outline-bg);
		box-shadow: 0 0 0 1px var(--inspector-outline-inner) inset;
		pointer-events: none;
	}

	.anchor-marker {
		position: fixed;
		z-index: 9998;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
		border: none;
		border-radius: 10px;
		background: var(--inspector-marker-color);
		color: var(--inspector-marker-foreground);
		box-shadow: var(--inspector-shadow-overlay);
		transform: translate(-50%, -50%);
		pointer-events: none;
	}

	.anchor-marker span {
		font-size: 1.2rem;
		line-height: 1;
		transform: translateY(-0.5px);
	}

	.composer {
		position: fixed;
		z-index: 9999;
		width: min(328px, calc(100vw - 28px));
		padding: 10px 10px 9px;
		border: 1px solid var(--inspector-composer-border);
		border-radius: 18px;
		background: var(--inspector-composer-surface);
		box-shadow: var(--inspector-shadow-composer);
		backdrop-filter: blur(18px);
	}

	.composer-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-bottom: 8px;
	}

	.target-label {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		min-width: 0;
		color: var(--inspector-text-muted);
		font-size: 0.8rem;
		font-style: italic;
	}

	.target-label span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.composer-input {
		width: 100%;
		min-height: 62px;
		padding: 10px 11px;
		border: 1px solid var(--inspector-accent);
		border-radius: 12px;
		background: var(--inspector-composer-input-surface);
		color: var(--inspector-text-primary);
		font: inherit;
		font-size: 0.84rem;
		line-height: 1.34;
		resize: none;
		outline: none;
		box-sizing: border-box;
	}

	.composer-input::placeholder {
		color: var(--inspector-text-subtle);
	}

	.composer-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 8px;
	}

	.delete-button,
	.cancel-button,
	.submit-button {
		border: none;
		background: transparent;
		font: inherit;
		cursor: pointer;
		transition:
			transform 160ms ease,
			opacity 160ms ease;
	}

	.delete-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		margin-right: auto;
		border-radius: 999px;
		color: var(--inspector-danger);
	}

	.delete-button:hover {
		background: var(--inspector-danger-soft);
	}

	.cancel-button {
		color: var(--inspector-text-muted);
		font-size: 0.82rem;
		font-weight: 600;
	}

	.submit-button {
		padding: 8px 16px;
		border-radius: 999px;
		background: var(--inspector-marker-color);
		color: var(--inspector-marker-foreground);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.cancel-button.inactive-action {
		opacity: 0.4;
	}

	.submit-button:disabled {
		background: var(--inspector-surface-soft);
		color: var(--inspector-text-subtle);
		cursor: not-allowed;
		transform: none;
	}

	.cancel-button:hover,
	.submit-button:hover {
		opacity: 0.92;
		transform: translateY(-1px);
	}

	.submit-button:disabled:hover {
		opacity: 1;
		transform: none;
	}
</style>
