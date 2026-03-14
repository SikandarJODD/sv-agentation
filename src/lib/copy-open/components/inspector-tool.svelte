<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import {
		Check,
		Copy,
		EllipsisVertical,
		Eye,
		EyeOff,
		PanelBottom,
		Play,
		Settings,
		Trash2,
		X
	} from '@lucide/svelte';

	import type { InspectorNote, NotesSettings, ToolbarState } from '../types';
	import { DEFAULT_MARKER_COLORS, EXPANDED_TOOLBAR_WIDTH } from '../utils/notes';

	let {
		active,
		notes,
		settings,
		toolbar,
		onCloseToolbar,
		onCopyNotes,
		onDeleteAllCancel,
		onDeleteAllConfirm,
		onDeleteAllRequest,
		onSetBlockPageInteractions,
		onSetMarkerColor,
		onToggle,
		onToggleNotesVisibility,
		onToggleSettings,
		onToggleToolbar,
		onToolbarPointerDown
	}: {
		active: boolean;
		notes: InspectorNote[];
		settings: NotesSettings;
		toolbar: ToolbarState;
		onCloseToolbar: () => void;
		onCopyNotes: () => Promise<boolean>;
		onDeleteAllCancel: () => void;
		onDeleteAllConfirm: () => void;
		onDeleteAllRequest: () => void;
		onSetBlockPageInteractions: (value: boolean) => void;
		onSetMarkerColor: (color: string) => void;
		onToggle: () => void;
		onToggleNotesVisibility: () => void;
		onToggleSettings: () => void;
		onToggleToolbar: () => void;
		onToolbarPointerDown: (event: PointerEvent) => void;
	} = $props();

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
</script>

<div
	class="toolbar-layer"
	data-inspector-ui
	style={`left:${toolbar.position.x}px;top:${toolbar.position.y}px;--settings-panel-width:${settingsPanelWidth};`}
>
	{#if toolbar.settingsOpen}
		<div
			class="panel settings-panel"
			data-inspector-ui
			in:scale={{ duration: 180, start: 0.94 }}
			out:fade={{ duration: 150 }}
		>
			<div class="settings-head" data-inspector-ui>
				<div class="brand" data-inspector-ui>
					<span class="brand-mark" data-inspector-ui>/</span>
					<span class="brand-name" data-inspector-ui>agentation</span>
				</div>
				<div class="settings-meta" data-inspector-ui>
					<span class="version" data-inspector-ui>v2.3.3</span>
					<span class="head-icon" data-inspector-ui>
						<Settings size={13} />
					</span>
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

	{#if toolbar.confirmDeleteAll}
		<div
			class="panel confirm-panel"
			data-inspector-ui
			in:scale={{ duration: 160, start: 0.96 }}
			out:fade={{ duration: 140 }}
		>
			<p data-inspector-ui>Delete all notes for this page?</p>
			<div class="confirm-actions" data-inspector-ui>
				<button class="text-action" data-inspector-ui type="button" onclick={onDeleteAllCancel}>
					Cancel
				</button>
				<button class="danger-action" data-inspector-ui type="button" onclick={onDeleteAllConfirm}>
					Delete all
				</button>
			</div>
		</div>
	{/if}

	{#if toolbar.expanded}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="toolbar-shell"
			data-inspector-ui
			in:scale={{ duration: 180, start: 0.96 }}
			out:fade={{ duration: 150 }}
			onpointerdown={handleSurfacePointerDown}
		>
			<div class="toolbar" data-inspector-ui>
				<button
					aria-pressed={active}
					class:active-button={active}
					class="toolbar-button primary"
					data-inspector-ui
					title={active ? 'Stop annotation mode (I)' : 'Start annotation mode (I)'}
					type="button"
					onclick={onToggle}
				>
					<Play size={16} />
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
					class="toolbar-button"
					data-inspector-ui
					disabled={notes.length === 0}
					title="Delete all notes"
					type="button"
					onclick={onDeleteAllRequest}
				>
					<Trash2 size={16} />
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
		<div class="launcher-shell" data-inspector-ui onpointerdown={handleSurfacePointerDown}>
			<button
				aria-label="Open toolbar"
				class="launcher-button"
				data-inspector-ui
				title="Open toolbar"
				type="button"
				onclick={onToggleToolbar}
			>
				<PanelBottom size={20} />
			</button>
		</div>
	{/if}
</div>

<style>
	.toolbar-layer {
		position: fixed;
		z-index: 10000;
		pointer-events: none;
	}

	.toolbar-shell,
	.launcher-shell,
	.panel {
		pointer-events: auto;
	}

	.toolbar-shell,
	.launcher-shell {
		position: relative;
	}

	.launcher-shell {
		cursor: grab;
	}

	.launcher-shell:active,
	.toolbar-shell:active {
		cursor: grabbing;
	}

	.launcher-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 52px;
		height: 52px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 999px;
		background: rgba(27, 27, 29, 0.98);
		color: rgba(255, 255, 255, 0.92);
		box-shadow:
			0 18px 34px rgba(0, 0, 0, 0.18),
			0 12px 22px rgba(0, 0, 0, 0.14);
		cursor: pointer;
		transition:
			transform 180ms ease,
			box-shadow 180ms ease,
			background 180ms ease;
	}

	.launcher-button:hover {
		transform: translateY(-1px);
		box-shadow:
			0 20px 40px rgba(0, 0, 0, 0.22),
			0 14px 24px rgba(0, 0, 0, 0.16);
		background: rgba(24, 24, 27, 1);
	}

	.toolbar {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 7px 8px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 999px;
		background: rgba(28, 28, 30, 0.98);
		box-shadow:
			0 18px 34px rgba(0, 0, 0, 0.18),
			0 12px 22px rgba(0, 0, 0, 0.14);
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
		color: rgba(255, 255, 255, 0.78);
		cursor: pointer;
		transition:
			transform 180ms ease,
			color 180ms ease,
			background 180ms ease,
			box-shadow 180ms ease,
			opacity 180ms ease;
	}

	.toolbar-button:hover:not(:disabled) {
		color: rgba(255, 255, 255, 0.98);
		background: rgba(255, 255, 255, 0.06);
	}

	.toolbar-button:disabled {
		opacity: 0.38;
		cursor: not-allowed;
	}

	.toolbar-button.primary.active-button {
		background: rgba(10, 132, 255, 0.22);
		color: #45a3ff;
		box-shadow: inset 0 0 0 1px rgba(69, 163, 255, 0.3);
	}

	.toolbar-button.active-pane {
		background: rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.96);
	}

	.flash-button {
		background: rgba(20, 206, 76, 0.12);
		color: #79ef9f;
		box-shadow: inset 0 0 0 1px rgba(20, 206, 76, 0.22);
	}

	.divider {
		width: 1px;
		height: 18px;
		background: rgba(255, 255, 255, 0.1);
	}

	.panel {
		position: absolute;
		bottom: calc(100% + 10px);
		left: 0;
		width: min(340px, calc(100vw - 40px));
		padding: 18px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 22px;
		background: rgba(29, 29, 31, 0.98);
		color: rgba(255, 255, 255, 0.9);
		box-shadow:
			0 20px 40px rgba(0, 0, 0, 0.2),
			0 12px 20px rgba(0, 0, 0, 0.12);
		backdrop-filter: blur(18px);
	}

	.settings-panel {
		width: min(var(--settings-panel-width), calc(100vw - 16px));
		padding: 12px 14px 13px;
		border-radius: 24px;
	}

	.confirm-panel {
		width: 264px;
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
		color: rgba(255, 255, 255, 0.52);
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

	.head-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.34);
	}

	.settings-list,
	.settings-block {
		display: grid;
		gap: 10px;
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
		color: rgba(255, 255, 255, 0.88);
		font-weight: 600;
	}

	.settings-label {
		font-size: 0.84rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.settings-divider {
		width: 100%;
		height: 1px;
		background: rgba(255, 255, 255, 0.08);
	}

	.color-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.color-swatch {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
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
		border: 1px solid rgba(255, 255, 255, 0.18);
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.03);
		appearance: none;
		cursor: pointer;
		transition:
			border-color 160ms ease,
			background 160ms ease,
			box-shadow 160ms ease;
	}

	.settings-checkbox:checked {
		border-color: rgba(255, 255, 255, 0.94);
		background: rgba(255, 255, 255, 0.94);
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
	}

	.settings-checkbox:checked::after {
		content: '';
		position: absolute;
		left: 4px;
		top: 1px;
		width: 4px;
		height: 8px;
		border-right: 1.5px solid #111111;
		border-bottom: 1.5px solid #111111;
		transform: rotate(45deg);
	}

	.confirm-panel p {
		margin: 0;
		font-size: 0.92rem;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.7);
	}

	.confirm-actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 16px;
	}

	.text-action,
	.danger-action {
		border: none;
		background: transparent;
		font: inherit;
		cursor: pointer;
		transition:
			color 160ms ease,
			opacity 160ms ease;
	}

	.text-action {
		color: rgba(255, 255, 255, 0.62);
	}

	.danger-action {
		color: #ff7b73;
		font-weight: 600;
	}

	.text-action:hover,
	.danger-action:hover {
		opacity: 0.82;
	}

	@media (max-width: 640px) {
		.panel {
			left: 0;
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
