<script lang="ts">
	import { tick } from 'svelte';

	import type { InspectorToolProps } from '../internal/component-props';
	import ToolbarActions from './inspector-tool/toolbar-actions.svelte';
	import ToolbarLauncher from './inspector-tool/toolbar-launcher.svelte';
	import ToolbarSettingsPanel from './inspector-tool/toolbar-settings-panel.svelte';

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
	}: InspectorToolProps = $props();

	let toolbarLayerElement = $state<HTMLDivElement | null>(null);
	let settingsPanelElement = $state<HTMLDivElement | null>(null);
	let settingsPanelPlacement = $state<'above' | 'below'>('above');
	let settingsPanelOffsetX = $state(0);
	let settingsPanelMaxHeight = $state<number | null>(null);
	let settingsViewportTick = $state(0);

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
	style={`left:${toolbar.position.x}px;top:${toolbar.position.y}px;`}
>
	{#if toolbar.settingsOpen}
		<ToolbarSettingsPanel
			bind:panelElement={settingsPanelElement}
			placement={settingsPanelPlacement}
			settings={settings}
			style={getSettingsPanelStyle()}
			toolbar={toolbar}
			{toolbarPosition}
			onSetBlockPageInteractions={onSetBlockPageInteractions}
			onSetMarkerColor={onSetMarkerColor}
			onSetToolbarPosition={onSetToolbarPosition}
			onToggleThemeMode={onToggleThemeMode}
		/>
	{/if}

	{#if toolbar.expanded}
		<ToolbarActions
			active={active}
			{deleteAllState}
			{notes}
			{toolbar}
			onCloseToolbar={onCloseToolbar}
			onCopyNotes={onCopyNotes}
			onDeleteAll={onDeleteAll}
			onToggle={onToggle}
			onToggleNotesVisibility={onToggleNotesVisibility}
			onToggleSettings={onToggleSettings}
			onToolbarPointerDown={onToolbarPointerDown}
		/>
	{:else}
		<ToolbarLauncher {notes} onToggleToolbar={onToggleToolbar} onToolbarPointerDown={onToolbarPointerDown} />
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
</style>
