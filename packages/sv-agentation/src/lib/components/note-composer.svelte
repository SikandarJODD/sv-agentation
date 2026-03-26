<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { ChevronRight, Plus, Trash2 } from '@lucide/svelte';

	import type { NoteComposerProps } from '../internal/component-props';

	let { composer, value, onCancel, onDelete, onInput, onSubmit }: NoteComposerProps = $props();

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
		if (
			event.key === 'Enter' &&
			!event.shiftKey &&
			!event.metaKey &&
			!event.ctrlKey &&
			!event.altKey
		) {
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

	const getHasChanges = (
		composerState: NonNullable<NoteComposerProps['composer']>,
		nextValue: string
	) => nextValue.trim() !== composerState.initialValue.trim();

	const getCanSubmit = (
		composerState: NonNullable<NoteComposerProps['composer']>,
		nextValue: string
	) => nextValue.trim().length > 0 && getHasChanges(composerState, nextValue);

	const getOutlineClass = (composerState: NonNullable<NoteComposerProps['composer']>) =>
		composerState.noteKind === 'group' || composerState.noteKind === 'area'
			? 'outline dashed'
			: 'outline solid';
	let outlineTransition = { duration: 130 };
	let highlightTransition = { duration: 120 };
	let anchorTransition = { duration: 150, start: 0.74, opacity: 0 };
	let composerEnter = { duration: 180, start: 0.94, opacity: 0.18 };
	let composerExit = { duration: 180, start: 0.85, opacity: 0 };
</script>

{#if composer}
	{#each composer.outlineRects as rect, index (`outline-${index}`)}
		<div
			aria-hidden="true"
			class={getOutlineClass(composer)}
			data-inspector-ui
			style={`left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;--composer-accent:${composer.accentColor};`}
			in:fade={outlineTransition}
			out:fade={{ duration: 100 }}
		></div>
	{/each}

	{#each composer.highlightRects as rect, index (`highlight-${index}`)}
		<div
			aria-hidden="true"
			class="highlight-rect"
			data-inspector-ui
			style={`left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;--composer-accent:${composer.accentColor};`}
			in:fade={highlightTransition}
			out:fade={{ duration: 90 }}
		></div>
	{/each}

	<button
		aria-label="Active note anchor"
		class="anchor-marker"
		data-inspector-ui
		style={`left:${composer.markerLeft}px;top:${composer.markerTop}px;--composer-accent:${composer.accentColor};`}
		type="button"
		in:scale|global={anchorTransition}
		out:scale={{ duration: 120, start: 1, opacity: 0 }}
	>
		<span>
			<Plus size={16} />
		</span>
	</button>

	<div
		class="composer"
		data-inspector-ui
		style={`left:${composer.panelLeft}px;top:${composer.panelTop}px;`}
		in:scale={composerEnter}
		out:scale|global={composerExit}
	>
		<div class="composer-head" data-inspector-ui>
			<div class="target-label" data-inspector-ui>
				<!-- <ChevronRight size={14} /> -->
				<span data-inspector-ui>{composer.targetLabel}</span>
			</div>
		</div>

		{#if composer.selectedText}
			<div class="quote-block" data-inspector-ui>
				"{composer.selectedText}"
			</div>
		{/if}

		<textarea
			bind:this={textareaElement}
			class="composer-input"
			data-inspector-ui
			placeholder={composer.placeholder}
			rows="2"
			style={`--composer-accent:${composer.accentColor};`}
			{value}
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
				style={`--composer-accent:${composer.accentColor};`}
				type="button"
				onclick={handleSubmit}
			>
				{composer.noteId ? 'Save' : 'Add'}
			</button>
		</div>
	</div>
{/if}

<style>
	.outline,
	.highlight-rect {
		position: fixed;
		z-index: 9996;
		box-sizing: border-box;
		pointer-events: none;
	}

	.outline.solid {
		border: 1.5px solid color-mix(in srgb, var(--composer-accent) 70%, transparent);
		border-radius: 4px;
		background: color-mix(in srgb, var(--composer-accent) 5%, transparent);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--composer-accent) 12%, transparent) inset;
	}

	.outline.dashed {
		border: 2px dashed color-mix(in srgb, var(--composer-accent) 72%, transparent);
		border-radius: 4px;
		background: color-mix(in srgb, var(--composer-accent) 6%, transparent);
	}

	.highlight-rect {
		border-radius: 3px;
		background: color-mix(in srgb, var(--composer-accent) 18%, transparent);
	}

	.anchor-marker {
		position: fixed;
		z-index: 9998;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		padding: 0;
		border: none;
		border-radius: 100px;
		background: var(--composer-accent);
		color: #ffffff;
		box-shadow: var(--inspector-shadow-overlay);
		transform: translate(-50%, -50%);
		pointer-events: none;
	}

	.anchor-marker span {
		font-size: 1.15rem;
		line-height: 1;
		transform: translateY(-0.5px);
	}

	.composer {
		position: fixed;
		z-index: 9999;
		width: min(280px, calc(100vw - 28px));
		padding: 12px 12px 10px;
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
		gap: 4px;
		min-width: 0;
		color: var(--inspector-text-muted);
		font-size: 0.76rem;
	}

	.target-label span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.quote-block {
		margin-bottom: 8px;
		padding: 7px 8px;
		border-radius: 8px;
		background: var(--inspector-surface-soft);
		color: var(--inspector-text-muted);
		font-size: 0.76rem;
		font-style: italic;
		line-height: 1.4;
	}

	.composer-input {
		width: 100%;
		min-height: 64px;
		padding: 10px 11px;
		border: 1px solid color-mix(in srgb, var(--composer-accent) 88%, transparent);
		border-radius: 11px;
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
		width: 30px;
		height: 30px;
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
		font-weight: 500;
		padding: 0.4rem 0.875rem;
		border-radius: 999px;
	}

	.submit-button {
		padding: 0.4rem 0.875rem;
		border-radius: 999px;
		background: var(--composer-accent);
		color: #ffffff;
		font-size: 0.82rem;
		font-weight: 500;
	}

	.cancel-button.inactive-action {
		opacity: 0.4;
	}

	.submit-button:disabled {
		/* background: var(--inspector-surface-soft); */
		/* color: var(--inspector-text-subtle); */
		opacity: 0.5;
		cursor: not-allowed !important;
		transform: none;
	}

	/* .cancel-button:hover,
	.submit-button:hover {
		opacity: 0.92;
		transform: translateY(-1px);
	} */
	.cancel-button:hover  {
		opacity: 0.92;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
	}

	/* .submit-button:disabled:hover {
		opacity: 1;
		transform: none;
	} */
</style>
