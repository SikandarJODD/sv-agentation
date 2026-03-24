<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { scale, slide } from 'svelte/transition';
	import {
		Check,
		Copy,
		Eye,
		EyeOff,
		Pause,
		Play,
		RotateCcw,
		Settings,
		Trash2,
		X
	} from '@lucide/svelte';

	import type { InspectorToolbarActionsProps } from '../../internal/component-props';

	let {
		active,
		deleteAllState,
		notes,
		toolbar,
		toolbarDragEnabled,
		onCloseToolbar,
		onCopyNotes,
		onDeleteAll,
		onToggle,
		onToggleNotesVisibility,
		onToggleSettings,
		onToolbarPointerDown
	}: InspectorToolbarActionsProps = $props();

	const handleSurfacePointerDown = (event: PointerEvent) => {
		if (!toolbarDragEnabled) return;
		const target = event.target;
		if (target instanceof Element && target.closest('button, input, textarea, label')) return;
		onToolbarPointerDown(event);
	};

	const handleNotesCopyClick = async (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		await onCopyNotes();
	};

	const toolbarTransition = {
		axis: 'x' as const,
		duration: 190,
		easing: cubicOut
	};
	const badgeTransition = {
		duration: 140,
		start: 0.86,
		opacity: 0,
		easing: cubicOut
	};
	const getDeleteAllRemainingSeconds = (state: typeof deleteAllState) =>
		Math.max(1, Math.ceil(state.remainingMs / 1000));
	const getDeleteAllProgressDegrees = (state: typeof deleteAllState) =>
		`${Math.max(0, Math.min(360, state.progress * 360)).toFixed(1)}deg`;
	const getDeleteAllTitle = (state: typeof deleteAllState) =>
		state.active
			? `Cancel delete all notes (${getDeleteAllRemainingSeconds(state)}s left)`
			: 'Delete all notes';
</script>

<!-- Ignore: the shell only handles drag affordance around focusable children. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class:drag-enabled={toolbarDragEnabled}
	class="toolbar-shell"
	data-inspector-ui
	in:slide={toolbarTransition}
	out:slide={{ ...toolbarTransition, duration: 145 }}
	onpointerdown={handleSurfacePointerDown}
>
	<div class="toolbar" data-inspector-ui>
		<button
			aria-label={active ? 'Pause annotation mode (I)' : 'Start annotation mode (I)'}
			aria-pressed={active}
			class:active-button={active}
			class="toolbar-button primary"
			data-inspector-ui
			title={active ? 'Pause annotation mode (I)' : 'Start annotation mode (I)'}
			type="button"
			onclick={onToggle}
		>
			{#if active}
				<Pause size={16} />
			{:else}
				<Play size={16} />
			{/if}
		</button>

		<div class="divider" data-inspector-ui></div>

		<button
			class:active-pane={!toolbar.notesVisible}
			class="toolbar-button"
			data-inspector-ui
			title={toolbar.notesVisible ? 'Hide notes' : 'Show notes'}
			type="button"
			onclick={onToggleNotesVisibility}
		>
			{#if toolbar.notesVisible}
				<Eye size={16} />
			{:else}
				<EyeOff size={16} />
			{/if}
		</button>

		<button
			class:flash-button={toolbar.copyFeedback}
			class="toolbar-button"
			data-inspector-ui
			disabled={notes.length === 0}
			title="Copy notes as Markdown"
			type="button"
			onclick={handleNotesCopyClick}
		>
			{#if toolbar.copyFeedback}
				<Check size={16} />
			{:else}
				<Copy size={16} />
			{/if}
		</button>

		<button
			aria-label={getDeleteAllTitle(deleteAllState)}
			class:pending-delete={deleteAllState.active}
			class="toolbar-button delete-button"
			data-inspector-ui
			disabled={notes.length === 0}
			style={deleteAllState.active
				? `--delete-progress:${getDeleteAllProgressDegrees(deleteAllState)};`
				: undefined}
			title={getDeleteAllTitle(deleteAllState)}
			type="button"
			onclick={onDeleteAll}
		>
			{#if deleteAllState.active}
				<span aria-hidden="true" class="delete-progress-ring" data-inspector-ui></span>
				<span aria-hidden="true" class="delete-progress-face" data-inspector-ui></span>
			{/if}
			<span class="delete-icon" data-inspector-ui>
				{#if deleteAllState.active}
					<RotateCcw size={15} />
				{:else}
					<Trash2 size={16} />
				{/if}
			</span>
			{#if deleteAllState.active}
				<span
					class="delete-countdown"
					data-inspector-ui
					in:scale={badgeTransition}
					out:scale={{ ...badgeTransition, duration: 110 }}
				>
					{getDeleteAllRemainingSeconds(deleteAllState)}s
				</span>
			{/if}
		</button>

		<button
			class:active-pane={toolbar.settingsOpen}
			class="toolbar-button"
			data-inspector-ui
			title="Toolbar settings"
			type="button"
			onclick={onToggleSettings}
		>
			<Settings size={16} />
		</button>

		<div class="divider" data-inspector-ui></div>

		<button
			class="toolbar-button"
			data-inspector-ui
			title="Collapse toolbar"
			type="button"
			onclick={onCloseToolbar}
		>
			<X size={17} />
		</button>
	</div>
</div>

<style>
	.toolbar-shell {
		position: relative;
		transform-origin: right bottom;
		will-change: transform, opacity;
		pointer-events: auto;
	}

	.toolbar-shell.drag-enabled {
		cursor: grab;
	}

	.toolbar-shell.drag-enabled:active {
		cursor: grabbing;
	}

	.toolbar {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 7px 8px;
		border: 1px solid var(--inspector-border);
		border-radius: 999px;
		background: var(--inspector-toolbar-surface);
		box-shadow: none;
		backdrop-filter: blur(18px);
	}

	.toolbar-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 34px;
		height: 34px;
		padding: 0;
		border: none;
		border-radius: 999px;
		background: transparent;
		color: var(--inspector-text-secondary);
		cursor: pointer;
		transition:
			transform 180ms ease,
			color 180ms ease,
			background 180ms ease,
			box-shadow 180ms ease,
			opacity 180ms ease;
	}

	.toolbar-button:hover:not(:disabled) {
		color: var(--inspector-text-primary);
		background: var(--inspector-toolbar-hover);
	}

	.toolbar-button:disabled {
		opacity: 0.38;
		cursor: not-allowed;
	}

	.toolbar-button.primary.active-button {
		background: var(--inspector-accent-soft);
		color: var(--inspector-accent-text);
		box-shadow: inset 0 0 0 1px var(--inspector-accent-border);
	}

	.toolbar-button.active-pane {
		background: var(--inspector-surface-soft);
		color: var(--inspector-text-primary);
	}

	.flash-button {
		background: var(--inspector-success-soft);
		color: var(--inspector-success);
		box-shadow: inset 0 0 0 1px rgba(20, 206, 76, 0.22);
	}

	.delete-button {
		position: relative;
		isolation: isolate;
	}

	.delete-button.pending-delete {
		color: var(--inspector-danger);
		background: transparent;
		box-shadow: none;
	}

	.delete-button.pending-delete:hover:not(:disabled) {
		color: var(--inspector-danger);
		background: transparent;
		box-shadow: none;
		transform: translateY(-0.5px);
	}

	.delete-progress-ring,
	.delete-progress-face {
		position: absolute;
		border-radius: 999px;
		pointer-events: none;
	}

	.delete-progress-ring {
		inset: 0;
		z-index: -2;
		background: conic-gradient(
			from -90deg,
			color-mix(in srgb, var(--inspector-danger) 92%, transparent) 0deg var(--delete-progress),
			color-mix(in srgb, var(--inspector-danger) 18%, transparent) var(--delete-progress) 360deg
		);
		box-shadow:
			0 0 0 1px color-mix(in srgb, var(--inspector-danger) 22%, transparent),
			0 10px 18px color-mix(in srgb, var(--inspector-danger) 12%, transparent);
	}

	.delete-progress-face {
		inset: 1.5px;
		z-index: -1;
		background: var(--inspector-toolbar-surface);
	}

	.delete-icon {
		position: relative;
		z-index: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.delete-countdown {
		position: absolute;
		top: -5px;
		right: -8px;
		z-index: 2;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 24px;
		height: 18px;
		padding: 0 6px;
		border: 1px solid color-mix(in srgb, var(--inspector-danger) 26%, transparent);
		border-radius: 999px;
		background: color-mix(in srgb, var(--inspector-danger) 94%, #ffffff 6%);
		color: #ffffff;
		box-shadow: 0 8px 16px color-mix(in srgb, var(--inspector-danger) 20%, transparent);
		font-size: 0.64rem;
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.01em;
		pointer-events: none;
	}

	.divider {
		width: 1px;
		height: 18px;
		background: var(--inspector-divider);
	}

	@media (max-width: 640px) {
		.toolbar {
			gap: 5px;
			padding: 7px;
		}

		.toolbar-button {
			width: 32px;
			height: 32px;
		}
	}
</style>
