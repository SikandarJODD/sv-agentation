<script lang="ts">
	import type { InspectorToolProps } from '../internal/component-props';
	import { COLLAPSED_TOOLBAR_SIZE, EXPANDED_TOOLBAR_WIDTH } from '../utils/notes';
	import ToolbarActions from './inspector-tool/toolbar-actions.svelte';
	import ToolbarLauncher from './inspector-tool/toolbar-launcher.svelte';
	import ToolbarSettingsPanel from './inspector-tool/toolbar-settings-panel.svelte';

	let {
		active,
		deleteAllState,
		notes,
		settings,
		toolbar,
		toolbarDragEnabled,
		toolbarPosition,
		onCloseToolbar,
		onCopyNotes,
		onDeleteAll,
		onSetBlockPageInteractions,
		onSetClearOnCopy,
		onSetIncludeComponentContext,
		onSetIncludeComputedStyles,
		onSetMarkerColor,
		onSetOutputMode,
		onSetPauseAnimations,
		onSetToolbarPosition,
		onToggle,
		onToggleNotesVisibility,
		onToggleSettings,
		onToggleThemeMode,
		onToggleToolbar,
		onToolbarPointerDown
	}: InspectorToolProps = $props();

	let toolbarLayerElement = $state<HTMLDivElement | null>(null);
	let toolbarShellElement = $state<HTMLDivElement | null>(null);
	let settingsPanelElement = $state<HTMLDivElement | null>(null);
	let settingsPanelPlacement = $state<'above' | 'below'>('above');
	let settingsPanelOffsetX = $state(0);
	let settingsPanelMaxHeight = $state<number | null>(null);
	let settingsLayoutFrame: number | null = null;

	const getToolbarShellStyle = () =>
		[
			`--toolbar-shell-width:${toolbar.expanded ? EXPANDED_TOOLBAR_WIDTH : COLLAPSED_TOOLBAR_SIZE}px`,
			`--toolbar-shell-height:${COLLAPSED_TOOLBAR_SIZE}px`
		].join(';');

	const getSettingsPanelStyle = () =>
		[
			`--settings-panel-offset-x:${settingsPanelOffsetX}px`,
			`--settings-panel-max-height:${settingsPanelMaxHeight === null ? 'none' : `${settingsPanelMaxHeight}px`}`
		].join(';');

	const resetSettingsPanelLayout = () => {
		settingsPanelPlacement = 'above';
		settingsPanelOffsetX = 0;
		settingsPanelMaxHeight = null;
	};

	const clearSettingsLayoutFrame = () => {
		if (settingsLayoutFrame === null || typeof window === 'undefined') return;

		window.cancelAnimationFrame(settingsLayoutFrame);
		settingsLayoutFrame = null;
	};

	const updateSettingsPanelLayout = () => {
		if (!toolbar.settingsOpen || !toolbarShellElement || !settingsPanelElement) return;

		const viewportPadding = 8;
		const panelGap = 10;
		const toolbarRect = toolbarShellElement.getBoundingClientRect();
		const panelWidth =
			Math.ceil(settingsPanelElement.getBoundingClientRect().width) ||
			settingsPanelElement.offsetWidth;
		const panelHeight = settingsPanelElement.scrollHeight;
		const spaceAbove = Math.max(0, toolbarRect.top - viewportPadding - panelGap);
		const spaceBelow = Math.max(
			0,
			window.innerHeight - toolbarRect.bottom - viewportPadding - panelGap
		);
		const shouldPlaceBelow = spaceAbove < panelHeight && spaceBelow > spaceAbove;
		const nextPlacement = shouldPlaceBelow ? 'below' : 'above';
		const availableHeight = nextPlacement === 'below' ? spaceBelow : spaceAbove;
		const clampedLeft = Math.min(
			Math.max(toolbarRect.left, viewportPadding),
			Math.max(viewportPadding, window.innerWidth - panelWidth - viewportPadding)
		);

		settingsPanelPlacement = nextPlacement;
		settingsPanelOffsetX = Math.round(clampedLeft - toolbarRect.left);
		settingsPanelMaxHeight = Math.max(0, Math.floor(availableHeight));
	};

	const queueSettingsPanelLayoutUpdate = () => {
		if (!toolbar.settingsOpen || typeof window === 'undefined') return;

		clearSettingsLayoutFrame();
		settingsLayoutFrame = window.requestAnimationFrame(() => {
			settingsLayoutFrame = null;
			updateSettingsPanelLayout();
		});
	};

	$effect(() => {
		if (!toolbar.settingsOpen) {
			clearSettingsLayoutFrame();
			resetSettingsPanelLayout();
			return;
		}

		toolbarShellElement;
		settingsPanelElement;
		toolbar.position.x;
		toolbar.position.y;
		toolbar.expanded;
		queueSettingsPanelLayoutUpdate();
	});

	$effect(() => {
		if (
			!toolbar.settingsOpen ||
			!toolbarShellElement ||
			!settingsPanelElement ||
			typeof ResizeObserver === 'undefined'
		) {
			return;
		}

		const resizeObserver = new ResizeObserver(() => {
			queueSettingsPanelLayoutUpdate();
		});

		resizeObserver.observe(toolbarShellElement);
		resizeObserver.observe(settingsPanelElement);
		queueSettingsPanelLayoutUpdate();

		return () => {
			resizeObserver.disconnect();
		};
	});

	const handleToolbarSurfacePointerDown = (event: PointerEvent) => {
		if (!toolbarDragEnabled) return;

		const target = event.target;
		if (target instanceof Element && target.closest('button, input, textarea, label')) return;
		onToolbarPointerDown(event);
	};
</script>

<svelte:window onresize={queueSettingsPanelLayoutUpdate} />

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
			{settings}
			style={getSettingsPanelStyle()}
			{toolbarPosition}
			{onSetBlockPageInteractions}
			{onSetClearOnCopy}
			{onSetIncludeComponentContext}
			{onSetIncludeComputedStyles}
			{onSetMarkerColor}
			{onSetOutputMode}
			{onSetPauseAnimations}
			{onSetToolbarPosition}
			{onToggleThemeMode}
		/>
	{/if}

	<!-- Ignore: the shell only handles drag affordance around focusable children. -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={toolbarShellElement}
		class:drag-enabled={toolbarDragEnabled}
		class:toolbar-expanded={toolbar.expanded}
		class="toolbar-shell"
		data-inspector-ui
		style={getToolbarShellStyle()}
		onpointerdown={handleToolbarSurfacePointerDown}
	>
		<div
			aria-hidden={toolbar.expanded}
			class:content-active={!toolbar.expanded}
			class="toolbar-content toolbar-launcher-content"
			data-inspector-ui
			inert={toolbar.expanded}
		>
			<ToolbarLauncher {notes} {onToggleToolbar} />
		</div>

		<div
			aria-hidden={!toolbar.expanded}
			class:content-active={toolbar.expanded}
			class="toolbar-content toolbar-actions-content"
			data-inspector-ui
			inert={!toolbar.expanded}
		>
			<ToolbarActions
				{active}
				{deleteAllState}
				{notes}
				{toolbar}
				{onCloseToolbar}
				{onCopyNotes}
				{onDeleteAll}
				{onToggle}
				{onToggleNotesVisibility}
				{onToggleSettings}
			/>
		</div>
	</div>
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

	.toolbar-shell {
		position: relative;
		width: var(--toolbar-shell-width);
		height: var(--toolbar-shell-height);
		border: 1px solid var(--inspector-border);
		border-radius: 999px;
		background: var(--inspector-toolbar-surface);
		box-shadow: none;
		backdrop-filter: blur(18px);
		overflow: visible;
		pointer-events: auto;
		transition:
			width 320ms cubic-bezier(0.2, 0.92, 0.24, 1),
			border-color 180ms ease,
			background 180ms ease;
		will-change: width;
	}

	.toolbar-shell.toolbar-expanded {
		overflow: clip;
	}

	.toolbar-shell.drag-enabled {
		cursor: grab;
	}

	.toolbar-shell.drag-enabled:active {
		cursor: grabbing;
	}

	.toolbar-content {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: stretch;
		justify-content: stretch;
		opacity: 0;
		pointer-events: none;
		transition:
			opacity 170ms ease,
			transform 240ms cubic-bezier(0.2, 0.92, 0.24, 1);
	}

	.toolbar-launcher-content {
		transform: scale(0.96);
	}

	.toolbar-actions-content {
		transform: translateX(10px) scale(0.98);
	}

	.toolbar-content.content-active {
		opacity: 1;
		transform: none;
		pointer-events: auto;
	}

	.toolbar-layer.dragging {
		transition: none;
	}

	.toolbar-layer.dragging .toolbar-shell {
		transition: none;
	}
</style>
