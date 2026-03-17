<script lang="ts">
	import { scale } from 'svelte/transition';
	import { Check, EllipsisVertical, Moon, SunMedium } from '@lucide/svelte';

	import type { InspectorPosition } from '../../types';
	import type { InspectorToolbarSettingsProps } from '../../internal/component-props';
	import { INSPECTOR_POSITION_OPTIONS } from '../../utils/position';
	import { DEFAULT_MARKER_COLORS, EXPANDED_TOOLBAR_WIDTH } from '../../utils/notes';

	let {
		settings,
		toolbar,
		toolbarPosition,
		onSetBlockPageInteractions,
		onSetMarkerColor,
		onSetToolbarPosition,
		onToggleThemeMode,
		panelElement = $bindable<HTMLDivElement | null>(null),
		placement = 'above',
		style = ''
	}: {
		panelElement?: HTMLDivElement | null;
		placement?: 'above' | 'below';
		style?: string;
	} & InspectorToolbarSettingsProps = $props();

	const panelTransition = {
		duration: 170,
		start: 0.96,
		opacity: 0
	};

	const toolbarPositionRows: (InspectorPosition | null)[][] = [
		['top-left', 'top-center', 'top-right'],
		['mid-left', null, 'mid-right'],
		['bottom-left', 'bottom-center', 'bottom-right']
	];
	const getToolbarPositionLabel = (position: InspectorPosition) =>
		INSPECTOR_POSITION_OPTIONS.find((option) => option.value === position)?.label ?? position;
	const getToolbarPositionIconClass = (position: InspectorPosition) =>
		`position-icon position-${position}`;
	const settingsPanelWidth = `${EXPANDED_TOOLBAR_WIDTH}px`;
</script>

<div
	bind:this={panelElement}
	class:panel-below={placement === 'below'}
	class="panel settings-panel"
	data-inspector-ui
	in:scale={panelTransition}
	out:scale={{ ...panelTransition, duration: 130 }}
	style={`--settings-panel-width:${settingsPanelWidth};${style}`}
>
	<div class="settings-head" data-inspector-ui>
		<div class="brand" data-inspector-ui>
			<span class="brand-mark" data-inspector-ui>/</span>
			<span class="brand-name" data-inspector-ui>sv-agentation</span>
		</div>
		<div class="settings-meta" data-inspector-ui>
			<span class="version" data-inspector-ui>0.1.0</span>
			<button
				aria-label={settings.themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
				class="theme-toggle"
				data-inspector-ui
				title={settings.themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
				type="button"
				onclick={onToggleThemeMode}
			>
				{#if settings.themeMode === 'dark'}
					<SunMedium size={13} />
				{:else}
					<Moon size={13} />
				{/if}
			</button>
		</div>
	</div>

	<div class="settings-list" data-inspector-ui>
		<div class="settings-row" data-inspector-ui>
			<span class="settings-row-label" data-inspector-ui>Output Detail</span>
			<div class="detail-pill" data-inspector-ui>
				<span data-inspector-ui>Standard</span>
				<EllipsisVertical size={12} />
			</div>
		</div>

		<div class="settings-divider" data-inspector-ui></div>

		<div class="settings-block" data-inspector-ui>
			<span class="settings-label" data-inspector-ui>Marker Color</span>
			<div class="color-row" data-inspector-ui>
				{#each DEFAULT_MARKER_COLORS as color}
					<button
						aria-label={`Set marker color ${color}`}
						class:color-active={settings.markerColor === color}
						class="color-swatch"
						data-inspector-ui
						style={`--swatch:${color};`}
						type="button"
						onclick={() => onSetMarkerColor(color)}
					>
						{#if settings.markerColor === color}
							<Check size={12} />
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<div class="settings-divider" data-inspector-ui></div>

		<div class="settings-block" data-inspector-ui>
			<span class="settings-label" data-inspector-ui>Toolbar Position</span>
			<div class="position-picker" data-inspector-ui>
				<div class="position-grid" data-inspector-ui>
					{#each toolbarPositionRows as row, rowIndex (`toolbar-position-row-${rowIndex}`)}
						{#each row as position, columnIndex (`toolbar-position-${rowIndex}-${columnIndex}`)}
							{#if position}
								<button
									aria-label={getToolbarPositionLabel(position)}
									aria-pressed={toolbarPosition === position}
									class:position-active={toolbarPosition === position}
									class="position-chip"
									data-inspector-ui
									title={getToolbarPositionLabel(position)}
									type="button"
									onclick={() => onSetToolbarPosition(position)}
								>
									<span
										aria-hidden="true"
										class={getToolbarPositionIconClass(position)}
										data-inspector-ui
									></span>
								</button>
							{:else}
								<div aria-hidden="true" class="position-gap" data-inspector-ui></div>
							{/if}
						{/each}
					{/each}
				</div>
			</div>
			<p class="settings-hint" data-inspector-ui>Press R to reset to bottom right</p>
		</div>

		<div class="settings-divider" data-inspector-ui></div>

		<label class="toggle-row block-toggle" data-inspector-ui>
			<span data-inspector-ui>Block page interactions</span>
			<input
				checked={settings.blockPageInteractions}
				class="settings-checkbox"
				data-inspector-ui
				type="checkbox"
				onchange={(event) =>
					onSetBlockPageInteractions((event.currentTarget as HTMLInputElement).checked)}
			/>
		</label>
	</div>
</div>

<style>
	.panel {
		position: absolute;
		bottom: calc(100% + 10px);
		left: var(--settings-panel-offset-x, 0px);
		width: min(340px, calc(100vw - 40px));
		max-height: var(--settings-panel-max-height, none);
		overflow-y: auto;
		padding: 18px;
		border: 1px solid var(--inspector-border);
		border-radius: 22px;
		background: var(--inspector-panel-surface);
		color: var(--inspector-text-primary);
		box-shadow: var(--inspector-shadow-panel);
		backdrop-filter: blur(18px);
		overscroll-behavior: contain;
		transform-origin: left bottom;
		pointer-events: auto;
	}

	.panel.panel-below {
		top: calc(100% + 10px);
		bottom: auto;
		transform-origin: left top;
	}

	.settings-panel {
		width: min(var(--settings-panel-width), calc(100vw - 16px));
		padding: 11px 13px 12px;
		border-radius: 24px;
	}

	.settings-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 10px;
	}

	.brand-name {
		font-size: 0.94rem;
		font-weight: 600;
	}

	.version {
		font-size: 0.76rem;
		color: var(--inspector-text-muted);
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.brand-mark {
		color: #14ce4c;
		font-size: 1rem;
		font-weight: 700;
	}

	.settings-meta {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}

	.theme-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		border: 1px solid var(--inspector-border);
		border-radius: 999px;
		background: var(--inspector-surface-soft);
		color: var(--inspector-text-muted);
		cursor: pointer;
		transition:
			color 160ms ease,
			background 160ms ease,
			border-color 160ms ease,
			transform 160ms ease;
	}

	.theme-toggle:hover {
		color: var(--inspector-text-primary);
		background: var(--inspector-toolbar-hover);
		transform: translateY(-0.5px);
	}

	.settings-list,
	.settings-block {
		display: grid;
		gap: 10px;
	}

	.position-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 3px;
	}

	.position-picker {
		padding: 5px;
		border: 1px solid var(--inspector-border);
		border-radius: 14px;
		background: color-mix(in srgb, var(--inspector-surface-soft) 84%, transparent);
	}

	.position-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 24px;
		padding: 0;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: var(--inspector-text-secondary);
		cursor: pointer;
		transition:
			color 160ms ease,
			background 160ms ease,
			box-shadow 160ms ease,
			transform 160ms ease;
	}

	.position-chip:hover {
		color: var(--inspector-text-primary);
		background: color-mix(in srgb, var(--inspector-toolbar-hover) 84%, transparent);
	}

	.position-chip.position-active {
		background: color-mix(in srgb, var(--inspector-marker-color) 16%, transparent);
		box-shadow: inset 0 0 0 1px
			color-mix(in srgb, var(--inspector-marker-color) 28%, var(--inspector-border));
		color: var(--inspector-text-primary);
	}

	.position-icon {
		position: relative;
		display: inline-flex;
		width: 12px;
		height: 12px;
		border: 1px solid color-mix(in srgb, currentColor 42%, transparent);
		border-radius: 3px;
	}

	.position-icon::after {
		content: '';
		position: absolute;
		width: 3px;
		height: 3px;
		border-radius: 999px;
		background: currentColor;
	}

	.position-top-left::after {
		top: 1.5px;
		left: 1.5px;
	}

	.position-top-center::after {
		top: 1.5px;
		left: 50%;
		transform: translateX(-50%);
	}

	.position-top-right::after {
		top: 1.5px;
		right: 1.5px;
	}

	.position-mid-left::after {
		top: 50%;
		left: 1.5px;
		transform: translateY(-50%);
	}

	.position-mid-right::after {
		top: 50%;
		right: 1.5px;
		transform: translateY(-50%);
	}

	.position-bottom-left::after {
		left: 1.5px;
		bottom: 1.5px;
	}

	.position-bottom-center::after {
		left: 50%;
		bottom: 1.5px;
		transform: translateX(-50%);
	}

	.position-bottom-right::after {
		right: 1.5px;
		bottom: 1.5px;
	}

	.position-gap {
		min-height: 24px;
		border-radius: 8px;
		background: transparent;
	}

	.settings-hint {
		margin: 0;
		color: var(--inspector-text-muted);
		font-size: 0.72rem;
		line-height: 1.3;
	}

	.settings-row,
	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		font-size: 0.88rem;
	}

	.settings-row-label,
	.detail-pill {
		font-size: 0.88rem;
	}

	.detail-pill {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		color: var(--inspector-text-primary);
		font-weight: 600;
	}

	.settings-label {
		font-size: 0.84rem;
		color: var(--inspector-text-muted);
	}

	.settings-divider {
		width: 100%;
		height: 1px;
		background: var(--inspector-divider);
	}

	.color-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.color-swatch {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		padding: 0;
		border: 1px solid transparent;
		border-radius: 999px;
		background: var(--swatch);
		color: #ffffff;
		cursor: pointer;
		transition:
			transform 160ms ease,
			box-shadow 160ms ease,
			border-color 160ms ease;
	}

	.color-swatch:hover {
		transform: translateY(-1px);
	}

	.color-swatch.color-active {
		border-color: rgba(20, 206, 76, 0.95);
		box-shadow: 0 0 0 2px rgba(20, 206, 76, 0.18);
	}

	.block-toggle {
		font-size: 0.84rem;
	}

	.settings-checkbox {
		position: relative;
		width: 16px;
		height: 16px;
		margin: 0;
		border: 1px solid var(--inspector-checkbox-border);
		border-radius: 4px;
		background: var(--inspector-checkbox-bg);
		appearance: none;
		cursor: pointer;
		transition:
			border-color 160ms ease,
			background 160ms ease,
			box-shadow 160ms ease;
	}

	.settings-checkbox:checked {
		border-color: var(--inspector-checkbox-checked-bg);
		background: var(--inspector-checkbox-checked-bg);
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
	}

	.settings-checkbox:checked::after {
		content: '';
		position: absolute;
		left: 4px;
		top: 1px;
		width: 4px;
		height: 8px;
		border-right: 1.5px solid var(--inspector-checkbox-check);
		border-bottom: 1.5px solid var(--inspector-checkbox-check);
		transform: rotate(45deg);
	}

	@media (max-width: 640px) {
		.panel {
			width: min(var(--settings-panel-width, 300px), calc(100vw - 16px));
		}
	}
</style>
