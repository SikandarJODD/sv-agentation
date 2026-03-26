<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { scale, slide } from 'svelte/transition';
	import { Check, ChevronDown, ChevronRight, Moon, SunMedium } from '@lucide/svelte';

	import type { InspectorPosition, OutputMode } from '../../types';
	import type { InspectorToolbarSettingsProps } from '../../internal/component-props';
	import { INSPECTOR_POSITION_OPTIONS } from '../../utils/position';
	import { DEFAULT_MARKER_COLORS, EXPANDED_TOOLBAR_WIDTH } from '../../utils/notes';

	let {
		settings,
		toolbarPosition,
		onSetBlockPageInteractions,
		onSetClearOnCopy,
		onSetIncludeComponentContext,
		onSetIncludeComputedStyles,
		onSetMarkerColor,
		onSetOutputMode,
		onSetPauseAnimations,
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
	let behaviorOpen = $state(false);
	let toolbarPositionOpen = $state(false);

	const getToolbarPositionLabel = (position: InspectorPosition) =>
		INSPECTOR_POSITION_OPTIONS.find((option) => option.value === position)?.label ?? position;
	const getToolbarPositionIconClass = (position: InspectorPosition) =>
		`position-icon position-${position}`;
	const settingsPanelWidth = `${EXPANDED_TOOLBAR_WIDTH}px`;
	const outputModeOptions: {
		value: OutputMode;
		label: string;
	}[] = [
		{ value: 'compact', label: 'Compact' },
		{ value: 'standard', label: 'Standard' },
		{ value: 'detailed', label: 'Detailed' },
		{ value: 'forensic', label: 'Forensic' }
	];
	const behaviorOptions = [
		{
			key: 'block-page-interactions',
			label: 'Block page interactions',
			checked: () => settings.blockPageInteractions,
			onChange: (value: boolean) => onSetBlockPageInteractions(value)
		},
		{
			key: 'pause-animations',
			label: 'Pause animations',
			checked: () => settings.pauseAnimations,
			onChange: (value: boolean) => onSetPauseAnimations(value)
		},
		{
			key: 'clear-on-copy',
			label: 'Clear on copy',
			checked: () => settings.clearOnCopy,
			onChange: (value: boolean) => onSetClearOnCopy(value)
		},
		{
			key: 'component-context',
			label: 'Component context',
			checked: () => settings.includeComponentContext,
			onChange: (value: boolean) => onSetIncludeComponentContext(value)
		},
		{
			key: 'computed-styles',
			label: 'Computed styles',
			checked: () => settings.includeComputedStyles,
			onChange: (value: boolean) => onSetIncludeComputedStyles(value)
		}
	] as const;
	const getOutputModeMeta = (outputMode: OutputMode) =>
		outputModeOptions.find((option) => option.value === outputMode) ?? outputModeOptions[0];
	const cycleOutputMode = () => {
		const currentIndex = outputModeOptions.findIndex(
			(option) => option.value === settings.outputMode
		);
		const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % outputModeOptions.length;
		onSetOutputMode(outputModeOptions[nextIndex]?.value ?? 'standard');
	};
	const getOutputModeIndex = (outputMode: OutputMode) =>
		Math.max(
			0,
			outputModeOptions.findIndex((option) => option.value === outputMode)
		);
		// Press R to reset to the latest prop value, saved placement, or default.
	const toolbarResetHint =
		'Press R to reset to the position of toolbar';
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
			<span class="version" data-inspector-ui>0.2.5</span>
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
		<button
			aria-label="Cycle output mode"
			class="settings-row-button interactive-row"
			data-inspector-ui
			title="Cycle output mode"
			type="button"
			onclick={cycleOutputMode}
		>
			<span class="settings-row-copy" data-inspector-ui>
				<span class="settings-row-label-group" data-inspector-ui>
					<span class="settings-row-label" data-inspector-ui>Output Mode</span>
				</span>
			</span>
			<span class="settings-row-value output-value" data-inspector-ui>
				<span data-inspector-ui>{getOutputModeMeta(settings.outputMode).label}</span>
				<span class="mode-dots" data-inspector-ui>
					{#each outputModeOptions as _, index (`mode-dot-${index}`)}
						<span
							aria-hidden="true"
							class:mode-dot-active={index === getOutputModeIndex(settings.outputMode)}
							class="mode-dot"
							data-inspector-ui
						></span>
					{/each}
				</span>
			</span>
		</button>

		<div class="settings-divider" data-inspector-ui></div>

		<div class="settings-block settings-block-compact" data-inspector-ui>
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

		<div class="settings-block settings-block-compact" data-inspector-ui>
			<button
				aria-expanded={behaviorOpen}
				class="settings-row-button accordion-trigger"
				data-inspector-ui
				type="button"
				onclick={() => (behaviorOpen = !behaviorOpen)}
			>
				<span class="settings-row-label" data-inspector-ui>Behavior</span>
				<span class="settings-row-value accordion-value" data-inspector-ui>
					<span class="accordion-summary" data-inspector-ui>{behaviorOptions.length} options</span>
					{#if behaviorOpen}
						<ChevronDown size={14} />
					{:else}
						<ChevronRight size={14} />
					{/if}
				</span>
			</button>

			{#if behaviorOpen}
				<div
					class="accordion-content"
					data-inspector-ui
					in:slide={{ duration: 210, easing: cubicOut }}
					out:slide={{ duration: 180, easing: cubicOut }}
				>
					{#each behaviorOptions as option (option.key)}
						<label class="toggle-row switch-row" data-inspector-ui>
							<span class="toggle-copy" data-inspector-ui>{option.label}</span>
							<input
								checked={option.checked()}
								class="settings-switch"
								data-inspector-ui
								type="checkbox"
								onchange={(event) =>
									option.onChange((event.currentTarget as HTMLInputElement).checked)}
							/>
						</label>
					{/each}
				</div>
			{/if}
		</div>

		<div class="settings-divider" data-inspector-ui></div>

		<div class="settings-block settings-block-compact" data-inspector-ui>
			<button
				aria-expanded={toolbarPositionOpen}
				class="settings-row-button accordion-trigger"
				data-inspector-ui
				type="button"
				onclick={() => (toolbarPositionOpen = !toolbarPositionOpen)}
			>
				<span class="settings-row-label-group" data-inspector-ui>
					<span class="settings-row-label" data-inspector-ui>Toolbar Position</span>
				</span>
				<span class="settings-row-value accordion-value" data-inspector-ui>
					<span class="accordion-summary" data-inspector-ui
						>{getToolbarPositionLabel(toolbarPosition)}</span
					>
					{#if toolbarPositionOpen}
						<ChevronDown size={14} />
					{:else}
						<ChevronRight size={14} />
					{/if}
				</span>
			</button>

			{#if toolbarPositionOpen}
				<div
					class="accordion-content"
					data-inspector-ui
					in:slide={{ duration: 210, easing: cubicOut }}
					out:slide={{ duration: 180, easing: cubicOut }}
				>
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
					<p class="settings-hint" data-inspector-ui>{toolbarResetHint}</p>
				</div>
			{/if}
		</div>
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
		box-shadow: none;
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
		padding: 14px 12px 15px;
		border-radius: 20px;
	}

	.settings-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 12px;
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

	.settings-block-compact {
		gap: 10px;
	}

	.settings-row-button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		width: 100%;
		padding: 0;
		border: none;
		background: transparent;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}

	.settings-row-button:disabled {
		cursor: not-allowed;
		opacity: 0.82;
	}

	.interactive-row {
		padding: 6px 6px;
		border-radius: 10px;
		transition:
			background 160ms ease,
			transform 160ms ease;
	}

	.accordion-trigger {
		padding: 6px 6px;
		border-radius: 10px;
		transition:
			background 160ms ease,
			transform 160ms ease;
	}

	.interactive-row:hover,
	.accordion-trigger:hover {
		background: color-mix(in srgb, var(--inspector-toolbar-hover) 68%, transparent);
	}

	.interactive-row:hover {
		transform: translateY(-0.5px);
	}

	.interactive-row:disabled:hover {
		background: transparent;
		transform: none;
	}

	.settings-row-copy {
		display: grid;
		gap: 2px;
	}

	.settings-row-label-group,
	.toggle-copy {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		min-width: 0;
	}

	.settings-row-label {
		font-size: 0.8rem;
		color: var(--inspector-text-secondary);
	}

	.settings-row-value {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--inspector-text-primary);
		font-size: 0.8rem;
		font-weight: 470;
	}

	.output-value,
	.accordion-value {
		color: var(--inspector-text-primary);
	}

	.output-value {
		gap: 10px;
	}

	.mode-dots {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
	}

	.mode-dot {
		width: 3px;
		height: 3px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--inspector-text-muted) 42%, transparent);
		opacity: 0.68;
		transition:
			background 160ms ease,
			transform 160ms ease,
			opacity 160ms ease;
	}

	.mode-dot.mode-dot-active {
		background: var(--inspector-text-primary);
		opacity: 1;
		transform: scale(1.28);
	}

	.accordion-summary {
		color: var(--inspector-text-muted);
		font-size: 0.68rem;
		font-weight: 500;
	}

	.position-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 3px;
	}

	.position-picker {
		padding: 6px;
		border: 1px solid var(--inspector-border);
		border-radius: 12px;
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

	.position-chip:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.position-chip:disabled:hover {
		color: var(--inspector-text-secondary);
		background: transparent;
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
		padding-left: 4px;
		font-weight: 300 !important;
	}

	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		font-size: 0.79rem;
	}

	.settings-label {
		font-size: 0.72rem;
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

	.accordion-content {
		display: grid;
		gap: 8px;
		/* padding-top: 4px; */
		overflow: hidden;
	}

	.switch-row {
		font-size: 0.79rem;
	}

	.settings-switch {
		position: relative;
		width: 34px;
		height: 20px;
		margin: 0;
		border: 1px solid color-mix(in srgb, var(--inspector-border-strong) 88%, transparent);
		border-radius: 999px;
		background: color-mix(in srgb, var(--inspector-surface-soft) 92%, transparent);
		appearance: none;
		cursor: pointer;
		transition:
			border-color 160ms ease,
			background 160ms ease,
			box-shadow 160ms ease,
			transform 160ms ease;
	}

	.settings-switch::after {
		content: '';
		position: absolute;
		left: 2px;
		top: 2px;
		width: 14px;
		height: 14px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.94);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.24);
		transition:
			transform 160ms ease,
			background 160ms ease;
	}

	.settings-switch:hover {
		transform: translateY(-0.5px);
	}

	.settings-switch:disabled {
		cursor: not-allowed;
		opacity: 0.72;
	}

	.settings-switch:disabled:hover {
		transform: none;
	}

	.settings-switch:checked {
		border-color: color-mix(in srgb, var(--inspector-marker-color) 70%, transparent);
		background: color-mix(in srgb, var(--inspector-marker-color) 64%, transparent);
	}

	.settings-switch:checked::after {
		transform: translateX(14px);
	}

	@media (max-width: 640px) {
		.panel {
			width: min(var(--settings-panel-width, 300px), calc(100vw - 16px));
		}
	}
</style>
