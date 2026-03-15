<script lang="ts">
	import { tick } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade, scale, slide } from 'svelte/transition';
	import {
		Check,
		Copy,
		EllipsisVertical,
		Eye,
		EyeOff,
		Moon,
		Pause,
		PanelBottom,
		Play,
		RotateCcw,
		Settings,
		SunMedium,
		Trash2,
		X
	} from '@lucide/svelte';

	import type { InspectorNote, InspectorPosition, NotesSettings, ToolbarState } from '../types';
	import { INSPECTOR_POSITION_OPTIONS } from '../utils/position';
	import { DEFAULT_MARKER_COLORS, EXPANDED_TOOLBAR_WIDTH } from '../utils/notes';

	let {
		active,
		deleteAllState,
		notes,
		settings,
		toolbar,
		toolbarPosition,
		onCloseToolbar,
		onCopyNotes,
		onDeleteAll,
		onSetBlockPageInteractions,
		onSetMarkerColor,
		onSetToolbarPosition,
		onToggle,
		onToggleNotesVisibility,
		onToggleSettings,
		onToggleThemeMode,
		onToggleToolbar,
		onToolbarPointerDown
	}: {
		active: boolean;
		deleteAllState: {
			active: boolean;
			durationMs: number;
			remainingMs: number;
			progress: number;
		};
		notes: InspectorNote[];
		settings: NotesSettings;
		toolbar: ToolbarState;
		toolbarPosition: InspectorPosition;
		onCloseToolbar: () => void;
		onCopyNotes: () => Promise<boolean>;
		onDeleteAll: () => void;
		onSetBlockPageInteractions: (value: boolean) => void;
		onSetMarkerColor: (color: string) => void;
		onSetToolbarPosition: (position: InspectorPosition) => void;
		onToggle: () => void;
		onToggleNotesVisibility: () => void;
		onToggleSettings: () => void;
		onToggleThemeMode: () => void;
		onToggleToolbar: () => void;
		onToolbarPointerDown: (event: PointerEvent) => void;
	} = $props();

	let toolbarLayerElement = $state<HTMLDivElement | null>(null);
	let settingsPanelElement = $state<HTMLDivElement | null>(null);
	let settingsPanelPlacement = $state<'above' | 'below'>('above');
	let settingsPanelOffsetX = $state(0);
	let settingsPanelMaxHeight = $state<number | null>(null);
	let settingsViewportTick = $state(0);

	const handleSurfacePointerDown = (event: PointerEvent) => {
		const target = event.target;
		if (target instanceof Element && target.closest('button, input, textarea, label')) return;
		onToolbarPointerDown(event);
	};

	const handleNotesCopyClick = async (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		await onCopyNotes();
	};

	const settingsPanelWidth = `${EXPANDED_TOOLBAR_WIDTH}px`;
	const getNoteCountLabel = () => (notes.length > 99 ? '99+' : `${notes.length}`);
	const launcherTransition = {
		duration: 140,
		easing: cubicOut
	};
	const toolbarTransition = {
		axis: 'x' as const,
		duration: 190,
		easing: cubicOut
	};
	const panelTransition = {
		duration: 170,
		start: 0.96,
		opacity: 0,
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
	const toolbarPositionRows: (InspectorPosition | null)[][] = [
		['top-left', 'top-center', 'top-right'],
		['mid-left', null, 'mid-right'],
		['bottom-left', 'bottom-center', 'bottom-right']
	];
	const getToolbarPositionLabel = (position: InspectorPosition) =>
		INSPECTOR_POSITION_OPTIONS.find((option) => option.value === position)?.label ?? position;
	const getToolbarPositionIconClass = (position: InspectorPosition) =>
		`position-icon position-${position}`;
	const getSettingsPanelStyle = () =>
		[
			`--settings-panel-offset-x:${settingsPanelOffsetX}px`,
			`--settings-panel-max-height:${settingsPanelMaxHeight === null ? 'none' : `${settingsPanelMaxHeight}px`}`
		].join(';');
	const updateSettingsPanelLayout = () => {
		if (!toolbar.settingsOpen || !toolbarLayerElement || !settingsPanelElement) return;

		const viewportPadding = 8;
		const panelGap = 10;
		const panelWidth = settingsPanelElement.offsetWidth;
		const panelHeight = settingsPanelElement.scrollHeight;
		const layerHeight = toolbarLayerElement.offsetHeight;
		const targetLeft = toolbar.position.x;
		const targetTop = toolbar.position.y;
		const spaceAbove = Math.max(0, targetTop - viewportPadding - panelGap);
		const spaceBelow = Math.max(
			0,
			window.innerHeight - (targetTop + layerHeight) - viewportPadding - panelGap
		);
		const shouldPlaceBelow = spaceAbove < panelHeight && spaceBelow > spaceAbove;
		const nextPlacement = shouldPlaceBelow ? 'below' : 'above';
		const availableHeight = nextPlacement === 'below' ? spaceBelow : spaceAbove;
		const clampedLeft = Math.min(
			Math.max(targetLeft, viewportPadding),
			Math.max(viewportPadding, window.innerWidth - panelWidth - viewportPadding)
		);

		settingsPanelPlacement = nextPlacement;
		settingsPanelOffsetX = Math.round(clampedLeft - targetLeft);
		settingsPanelMaxHeight = Math.max(0, Math.floor(availableHeight));
	};
	const handleSettingsViewportChange = () => {
		settingsViewportTick += 1;
	};

	$effect(() => {
		if (!toolbar.settingsOpen) {
			settingsPanelPlacement = 'above';
			settingsPanelOffsetX = 0;
			settingsPanelMaxHeight = null;
			return;
		}

		settingsViewportTick;
		toolbarPosition;
		toolbar.position.x;
		toolbar.position.y;
		toolbar.expanded;

		void tick().then(() => {
			updateSettingsPanelLayout();
		});
	});
</script>

<svelte:window onresize={handleSettingsViewportChange} />

<div
	bind:this={toolbarLayerElement}
	class:dragging={toolbar.dragging}
	class="toolbar-layer"
	data-inspector-ui
	style={`left:${toolbar.position.x}px;top:${toolbar.position.y}px;--settings-panel-width:${settingsPanelWidth};`}
>
	{#if toolbar.settingsOpen}
		<div
			bind:this={settingsPanelElement}
			class:panel-below={settingsPanelPlacement === 'below'}
			class="panel settings-panel"
			data-inspector-ui
			in:scale={panelTransition}
			out:scale={{ ...panelTransition, duration: 130 }}
			style={getSettingsPanelStyle()}
		>
			<div class="settings-head" data-inspector-ui>
				<div class="brand" data-inspector-ui>
					<span class="brand-mark" data-inspector-ui>/</span>
					<span class="brand-name" data-inspector-ui>sv-agentation</span>
				</div>
				<div class="settings-meta" data-inspector-ui>
					<span class="version" data-inspector-ui>0.0.1</span>
					<button
						aria-label={settings.themeMode === 'dark'
							? 'Switch to light mode'
							: 'Switch to dark mode'}
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
	{/if}

	{#if toolbar.expanded}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
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
	{:else}
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
	{/if}
</div>

<style>
	.toolbar-layer {
		position: fixed;
		z-index: 10000;
		pointer-events: none;
		transition:
			left 320ms cubic-bezier(0.2, 0.92, 0.24, 1),
			top 320ms cubic-bezier(0.2, 0.92, 0.24, 1);
		will-change: left, top;
	}

	.toolbar-layer.dragging {
		transition: none;
	}

	.toolbar-shell,
	.launcher-shell,
	.panel {
		pointer-events: auto;
	}

	.toolbar-shell,
	.launcher-shell {
		position: relative;
		transform-origin: right bottom;
		will-change: transform, opacity;
	}

	.launcher-shell {
		cursor: grab;
	}

	.launcher-shell:active,
	.toolbar-shell:active {
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

	.launcher-button:hover {
		transform: translateY(-1px);
		box-shadow: var(--inspector-shadow-panel);
		background: var(--inspector-toolbar-surface);
	}

	.toolbar {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 7px 8px;
		border: 1px solid var(--inspector-border);
		border-radius: 999px;
		background: var(--inspector-toolbar-surface);
		box-shadow: var(--inspector-shadow-toolbar);
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
