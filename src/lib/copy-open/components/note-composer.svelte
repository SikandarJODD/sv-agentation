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
		border: 1.5px solid rgba(20, 206, 76, 0.82);
		border-radius: 4px;
		background: rgba(20, 206, 76, 0.08);
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
		background: #14ce4c;
		color: #ffffff;
		box-shadow:
			0 10px 24px rgba(20, 206, 76, 0.28),
			0 4px 12px rgba(0, 0, 0, 0.16);
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
		width: min(332px, calc(100vw - 28px));
		padding: 12px 12px 11px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 20px;
		background: rgba(28, 28, 30, 0.98);
		box-shadow:
			0 22px 42px rgba(0, 0, 0, 0.22),
			0 12px 20px rgba(0, 0, 0, 0.14);
		backdrop-filter: blur(18px);
	}

	.composer-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 10px;
	}

	.target-label {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		min-width: 0;
		color: rgba(255, 255, 255, 0.56);
		font-size: 0.82rem;
		font-style: italic;
	}

	.target-label span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.composer-input {
		width: 100%;
		min-height: 66px;
		padding: 12px 13px;
		border: 1px solid rgba(10, 132, 255, 0.94);
		border-radius: 12px;
		background: rgba(37, 37, 40, 1);
		color: #ffffff;
		font: inherit;
		font-size: 0.86rem;
		line-height: 1.38;
		resize: none;
		outline: none;
		box-sizing: border-box;
	}

	.composer-input::placeholder {
		color: rgba(255, 255, 255, 0.35);
	}

	.composer-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 10px;
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
		color: rgba(255, 123, 115, 0.92);
	}

	.delete-button:hover {
		background: rgba(255, 69, 58, 0.1);
	}

	.cancel-button {
		color: rgba(255, 255, 255, 0.56);
		font-size: 0.84rem;
		font-weight: 600;
	}

	.submit-button {
		padding: 9px 17px;
		border-radius: 999px;
		background: #14ce4c;
		color: #ffffff;
		font-size: 0.84rem;
		font-weight: 700;
	}

	.cancel-button.inactive-action {
		opacity: 0.4;
	}

	.submit-button:disabled {
		background: rgba(255, 255, 255, 0.12);
		color: rgba(255, 255, 255, 0.4);
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
