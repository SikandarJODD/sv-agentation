<script lang="ts">
	import type { InspectorToolbarLauncherProps } from '../../internal/component-props';
	import { scale } from 'svelte/transition';

	let { badgeFloating, badgeVisible, notes, onToggleToolbar }: InspectorToolbarLauncherProps =
		$props();

	const getNoteCountLabel = () => (notes.length > 99 ? '99+' : `${notes.length}`);
</script>

<button
	aria-label="Open toolbar"
	class="launcher-button"
	data-inspector-ui
	data-toolbar-launcher
	title="Open toolbar"
	type="button"
	onclick={onToggleToolbar}
>
	<!-- <PanelBottom size={20} /> -->
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none"
		><g clip-path="url(#clip0_list_sparkle)"
			><path
				d="M11.5 12L5.5 12"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			></path><path
				d="M18.5 6.75L5.5 6.75"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			></path><path
				d="M9.25 17.25L5.5 17.25"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			></path><path
				d="M16 12.75L16.5179 13.9677C16.8078 14.6494 17.3506 15.1922 18.0323 15.4821L19.25 16L18.0323 16.5179C17.3506 16.8078 16.8078 17.3506 16.5179 18.0323L16 19.25L15.4821 18.0323C15.1922 17.3506 14.6494 16.8078 13.9677 16.5179L12.75 16L13.9677 15.4821C14.6494 15.1922 15.1922 14.6494 15.4821 13.9677L16 12.75Z"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linejoin="round"
			></path></g
		><defs
			><clipPath id="clip0_list_sparkle"><rect width="24" height="24" fill="white"></rect></clipPath
			></defs
		></svg
	>
	{#if notes.length > 0}
		<span
			class:badge-floating={badgeFloating}
			class:badge-visible={badgeVisible}
			in:scale|global={{ duration: 200, start: 0.7 }}
			class="launcher-badge"
			data-inspector-ui>{getNoteCountLabel()}</span
		>
	{/if}
</button>

<style>
	.launcher-button {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		padding: 0;
		border: none;
		border-radius: inherit;
		background: transparent;
		color: var(--inspector-text-primary);
		cursor: pointer;
		transition:
			transform 180ms ease,
			background 180ms ease;
	}

	/* .launcher-button:hover {
		transform: translateY(-1px);
		background: var(--inspector-toolbar-hover);
	} */

	.launcher-badge {
		position: absolute;
		top: 6px;
		right: 6px;
		z-index: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		border-radius: 999px;
		background: var(--inspector-marker-color);
		color: white;
		font-size: 0.625rem;
		font-weight: 600;
		line-height: 1;
		letter-spacing: -0.01em;
		opacity: 0;
		pointer-events: none;
		transform: translate3d(0, 0, 0);
		transition:
			opacity 140ms ease,
			top 160ms cubic-bezier(0.2, 0.92, 0.24, 1),
			right 160ms cubic-bezier(0.2, 0.92, 0.24, 1),
			transform 160ms cubic-bezier(0.2, 0.92, 0.24, 1);
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.15),
			inset 0 0 0 1px rgba(255, 255, 255, 0.04);
	}

	.launcher-badge.badge-floating {
		top: -5px;
		right: -3px;
		transform: translate3d(0, 0, 0);
	}

	.launcher-badge.badge-visible {
		opacity: 1;
	}
</style>
