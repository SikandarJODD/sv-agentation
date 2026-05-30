<script lang="ts">
	import type { InspectorToolProps } from '../internal/component-props';
	import { COLLAPSED_TOOLBAR_SIZE, EXPANDED_TOOLBAR_WIDTH } from '../utils/notes';
	import ToolbarActions from './inspector-tool/toolbar-actions.svelte';
	import ToolbarLauncher from './inspector-tool/toolbar-launcher.svelte';
	import ToolbarPreviewPanel from './inspector-tool/toolbar-preview-panel.svelte';
	import ToolbarSettingsPanel from './inspector-tool/toolbar-settings-panel.svelte';

	let {
		active,
		deleteAllState,
		keyBindings,
		notes,
		settings,
		toolbar,
		toolbarDragEnabled,
		toolbarPosition,
		onCloseToolbar,
		onCloseToolbarPanel,
		onCopyNotes,
		onDeleteAll,
		onOpenNote,
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
		onTogglePreview,
		onToggleSettings,
		onToggleThemeMode,
		onToggleToolbar,
		onToolbarPointerDown
	}: InspectorToolProps = $props();

	let toolbarLayerElement = $state<HTMLDivElement | null>(null);
	let toolbarShellElement = $state<HTMLDivElement | null>(null);
	let overlayPanelElement = $state<HTMLDivElement | null>(null);
	let overlayPanelPlacement = $state<'above' | 'below'>('above');
	let overlayPanelOffsetX = $state(0);
	let overlayPanelMaxHeight = $state<number | null>(null);
	let overlayLayoutFrame: number | null = null;

	const getToolbarShellStyle = () =>
		[
			`--toolbar-shell-width:${toolbar.expanded ? EXPANDED_TOOLBAR_WIDTH : COLLAPSED_TOOLBAR_SIZE}px`,
			`--toolbar-shell-height:${COLLAPSED_TOOLBAR_SIZE}px`
		].join(';');

	const getOverlayPanelStyle = () =>
		[
			`--toolbar-panel-offset-x:${overlayPanelOffsetX}px`,
			...(overlayPanelMaxHeight === null
				? []
				: [`--toolbar-panel-max-height:${overlayPanelMaxHeight}px`])
		].join(';');

	const resetOverlayPanelLayout = () => {
		overlayPanelPlacement = 'above';
		overlayPanelOffsetX = 0;
		overlayPanelMaxHeight = null;
	};

	const clearOverlayLayoutFrame = () => {
		if (overlayLayoutFrame === null || typeof window === 'undefined') return;

		window.cancelAnimationFrame(overlayLayoutFrame);
		overlayLayoutFrame = null;
	};

	const updateOverlayPanelLayout = () => {
		if (toolbar.openPanel === null || !toolbarShellElement || !overlayPanelElement) return;

		const viewportPadding = 8;
		const panelGap = 10;
		const toolbarRect = toolbarShellElement.getBoundingClientRect();
		const panelWidth =
			Math.ceil(overlayPanelElement.getBoundingClientRect().width) ||
			overlayPanelElement.offsetWidth;
		const panelHeight = overlayPanelElement.scrollHeight;
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

		overlayPanelPlacement = nextPlacement;
		overlayPanelOffsetX = Math.round(clampedLeft - toolbarRect.left);
		overlayPanelMaxHeight = Math.max(0, Math.floor(availableHeight));
	};

	const queueOverlayPanelLayoutUpdate = () => {
		if (toolbar.openPanel === null || typeof window === 'undefined') return;

		clearOverlayLayoutFrame();
		overlayLayoutFrame = window.requestAnimationFrame(() => {
			overlayLayoutFrame = null;
			updateOverlayPanelLayout();
		});
	};

	$effect(() => {
		if (toolbar.openPanel === null) {
			clearOverlayLayoutFrame();
			resetOverlayPanelLayout();
			return;
		}

		toolbarShellElement;
		overlayPanelElement;
		toolbar.position.x;
		toolbar.position.y;
		toolbar.expanded;
		queueOverlayPanelLayoutUpdate();
	});

	$effect(() => {
		if (
			toolbar.openPanel === null ||
			!toolbarShellElement ||
			!overlayPanelElement ||
			typeof ResizeObserver === 'undefined'
		) {
			return;
		}

		const resizeObserver = new ResizeObserver(() => {
			queueOverlayPanelLayoutUpdate();
		});

		resizeObserver.observe(toolbarShellElement);
		resizeObserver.observe(overlayPanelElement);
		queueOverlayPanelLayoutUpdate();

		return () => {
			resizeObserver.disconnect();
		};
	});

	const handlePreviewOpenNote = async (noteId: string) => {
		const opened = await onOpenNote(noteId);
		if (opened) {
			onCloseToolbarPanel();
		}
		return opened;
	};

	const handleToolbarSurfacePointerDown = (event: PointerEvent) => {
		if (!toolbarDragEnabled) return;

		const target = event.target;
		if (target instanceof Element && target.closest('button, input, textarea, label')) return;
		onToolbarPointerDown(event);
	};
</script>

<svelte:window onresize={queueOverlayPanelLayoutUpdate} />

<div
	bind:this={toolbarLayerElement}
	class:dragging={toolbar.dragging}
	class="toolbar-layer"
	data-inspector-ui
	style={`left:${toolbar.position.x}px;top:${toolbar.position.y}px;`}
>
	{#if toolbar.openPanel === 'settings'}
		<ToolbarSettingsPanel
			bind:panelElement={overlayPanelElement}
			{keyBindings}
			placement={overlayPanelPlacement}
			{settings}
			style={getOverlayPanelStyle()}
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
	{:else if toolbar.openPanel === 'preview'}
		<ToolbarPreviewPanel
			bind:panelElement={overlayPanelElement}
			{notes}
			onOpenNote={handlePreviewOpenNote}
			placement={overlayPanelPlacement}
			style={getOverlayPanelStyle()}
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
				{keyBindings}
				{notes}
				{toolbar}
				{onCloseToolbar}
				{onCopyNotes}
				{onDeleteAll}
				{onToggle}
				{onToggleNotesVisibility}
				{onTogglePreview}
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
