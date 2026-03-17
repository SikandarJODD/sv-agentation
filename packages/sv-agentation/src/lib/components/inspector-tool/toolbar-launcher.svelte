<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import { PanelBottom } from '@lucide/svelte';

	import type { InspectorToolbarLauncherProps } from '../../internal/component-props';

	let { notes, onToggleToolbar, onToolbarPointerDown }: InspectorToolbarLauncherProps = $props();

	const handleSurfacePointerDown = (event: PointerEvent) => {
		const target = event.target;
		if (target instanceof Element && target.closest('button, input, textarea, label')) return;
		onToolbarPointerDown(event);
	};

	const launcherTransition = {
		duration: 140,
		easing: cubicOut
	};

	const getNoteCountLabel = () => (notes.length > 99 ? '99+' : `${notes.length}`);
</script>

<!-- Ignore: the shell only handles drag affordance around the launcher button. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="launcher-shell"
	data-inspector-ui
	in:fade={launcherTransition}
	out:fade={{ ...launcherTransition, duration: 120 }}
	onpointerdown={handleSurfacePointerDown}
>
	<button
		aria-label="Open toolbar"
		class="launcher-button"
		data-inspector-ui
		title="Open toolbar"
		type="button"
		onclick={onToggleToolbar}
	>
		<PanelBottom size={20} />
		{#if notes.length > 0}
			<span class="launcher-badge" data-inspector-ui>{getNoteCountLabel()}</span>
		{/if}
	</button>
</div>

<style>
	.launcher-shell {
		position: relative;
		transform-origin: right bottom;
		will-change: transform, opacity;
		pointer-events: auto;
		cursor: grab;
	}

	.launcher-shell:active {
		cursor: grabbing;
	}

	.launcher-button {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 52px;
		height: 52px;
		border: 1px solid var(--inspector-border);
		border-radius: 999px;
		background: var(--inspector-toolbar-surface);
		color: var(--inspector-text-primary);
		box-shadow: var(--inspector-shadow-toolbar);
		cursor: pointer;
		transition:
			transform 180ms ease,
			box-shadow 180ms ease,
			background 180ms ease;
	}

	.launcher-button:hover {
		transform: translateY(-1px);
		box-shadow: var(--inspector-shadow-panel);
		background: var(--inspector-toolbar-surface);
	}

	.launcher-badge {
		position: absolute;
		top: -4px;
		right: -4px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 22px;
		height: 22px;
		padding: 0 6px;
		border: 2px solid var(--inspector-toolbar-surface);
		border-radius: 999px;
		background: var(--inspector-marker-color);
		color: var(--inspector-marker-foreground);
		box-shadow: 0 8px 18px rgba(8, 10, 15, 0.2);
		font-size: 0.71rem;
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.01em;
		pointer-events: none;
	}
</style>
