<script lang="ts">
	import type { InspectorPosition } from '../types';
	import { INSPECTOR_POSITION_OPTIONS } from '../utils/position';

	let {
		enabled,
		menuOpen,
		position,
		onToggle,
		onMenuToggle,
		onPositionChange
	}: {
		enabled: boolean;
		menuOpen: boolean;
		position: InspectorPosition;
		onToggle: () => void;
		onMenuToggle: () => void;
		onPositionChange: (value: string) => void;
	} = $props();

	const handlePositionChange = (event: Event) => {
		const nextValue = (event.currentTarget as HTMLSelectElement).value;
		onPositionChange(nextValue);
	};
</script>

<div class="tool" data-inspector-ui data-position={position}>
	<div class="tool-row" data-inspector-ui>
		<button
			aria-pressed={enabled}
			class:active={enabled}
			class="tool-button"
			data-inspector-ui
			title="Toggle inspector (I)"
			type="button"
			onclick={onToggle}
		>
			<span>{enabled ? 'Inspect on' : 'Inspect off'}</span>
			<kbd>I</kbd>
		</button>

		<button
			aria-expanded={menuOpen}
			class="tool-button"
			data-inspector-ui
			title="Inspector settings"
			type="button"
			onclick={onMenuToggle}
		>
			Position
		</button>
	</div>

	{#if menuOpen}
		<div class="tool-menu" data-inspector-ui>
			<label class="tool-field" data-inspector-ui>
				<span>Inspector position</span>
				<select data-inspector-ui value={position} onchange={handlePositionChange}>
					{#each INSPECTOR_POSITION_OPTIONS as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</label>
		</div>
	{/if}
</div>

<style>
	.tool {
		position: fixed;
		z-index: 10000;
		display: grid;
		gap: 0.45rem;
		transition:
			opacity 180ms ease,
			filter 180ms ease;
	}

	@supports (view-transition-name: none) {
		.tool {
			view-transition-name: inspector-tool;
		}
	}

	.tool[data-position='top-left'] {
		top: 12px;
		left: 12px;
	}

	.tool[data-position='top-center'] {
		top: 12px;
		left: 50%;
		transform: translateX(-50%);
		align-items: center;
	}

	.tool[data-position='top-right'] {
		top: 12px;
		right: 12px;
		align-items: end;
	}

	.tool[data-position='mid-left'] {
		top: 50%;
		left: 12px;
		transform: translateY(-50%);
	}

	.tool[data-position='mid-right'] {
		top: 50%;
		right: 12px;
		transform: translateY(-50%);
		align-items: end;
	}

	.tool[data-position='bottom-left'] {
		bottom: 12px;
		left: 12px;
	}

	.tool[data-position='bottom-center'] {
		bottom: 12px;
		left: 50%;
		transform: translateX(-50%);
		align-items: center;
	}

	.tool[data-position='bottom-right'] {
		right: 12px;
		bottom: 12px;
		align-items: end;
	}

	.tool-row {
		display: flex;
		gap: 0.4rem;
		align-items: center;
	}

	.tool-button,
	select {
		border: 1px solid rgba(251, 146, 60, 0.22);
		background: rgba(67, 30, 9, 0.58);
		color: #ffedd5;
		font: inherit;
		font-size: 0.82rem;
	}

	.tool-button {
		display: inline-flex;
		gap: 0.4rem;
		align-items: center;
		padding: 0.5rem 0.72rem;
		border-radius: 999px;
		cursor: pointer;
	}

	.tool-button.active {
		border-color: rgba(251, 146, 60, 0.42);
		background: rgba(154, 52, 18, 0.7);
		color: #fff7ed;
	}

	.tool-button:hover,
	select:hover {
		border-color: rgba(251, 146, 60, 0.34);
		background: rgba(67, 30, 9, 0.72);
	}

	.tool-menu {
		min-width: 12rem;
		padding: 0.7rem;
		border: 1px solid rgba(251, 146, 60, 0.2);
		border-radius: 0.9rem;
		background: rgba(49, 24, 7, 0.84);
		box-shadow: 0 18px 38px rgba(0, 0, 0, 0.35);
		backdrop-filter: blur(10px);
	}

	.tool-field {
		display: grid;
		gap: 0.4rem;
	}

	.tool-field span {
		font-size: 0.76rem;
		color: rgba(255, 237, 213, 0.78);
	}

	select {
		width: 100%;
		padding: 0.5rem 0.65rem;
		border-radius: 0.65rem;
		outline: none;
	}

	kbd {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1rem;
		height: 1rem;
		padding: 0 0.2rem;
		border: 1px solid rgba(251, 146, 60, 0.32);
		border-radius: 999px;
		background: rgba(154, 52, 18, 0.3);
		color: #fdba74;
		font-size: 0.64rem;
		font-family: 'IBM Plex Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
		line-height: 1;
	}

	:global(::view-transition-old(inspector-tool)),
	:global(::view-transition-new(inspector-tool)) {
		animation-duration: 220ms;
		animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
	}
</style>
