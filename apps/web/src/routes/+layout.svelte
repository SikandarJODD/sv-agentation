<script lang="ts">
	import './layout.css';
	import { browser, dev } from '$app/environment';
	import { ModeWatcher } from 'mode-watcher';
	import { Agentation, type AgentationInspectorProps } from 'sv-agentation';
	import { asset } from '$app/paths';

	// Use the repo root so source links can resolve both the demo app and the package workspace.
	let workspaceRoot = 's:/advance_svelte/exp/svelte-learning';
	let playgroundAgentationProps: AgentationInspectorProps = {
		toolbarPosition: 'bottom-right',
		outputMode: 'detailed',
		pauseAnimations: true,
		clearOnCopy: false,
		includeComponentContext: true,
		includeComputedStyles: false
	};

	let { children } = $props();
</script>

<ModeWatcher defaultMode="light" />

<svelte:head><link rel="icon" href={asset('/main-favicon-light.svg')} /></svelte:head>
{@render children()}

<!-- {#if browser && dev} -->
<Agentation {workspaceRoot} {...playgroundAgentationProps} />
<!-- {/if} -->
