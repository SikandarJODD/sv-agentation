<script lang="ts">
	import './layout.css';
	import { browser, dev } from '$app/environment';
	import { ModeWatcher } from 'mode-watcher';
	import { Agentation, type AgentationInspectorProps } from 'sv-agentation';
	import { asset } from '$app/paths';

	let workspaceRoot = 's:/advance_svelte/exp/svelte-learning/apps/web';
	let playgroundAgentationProps: AgentationInspectorProps = {
		toolbarPosition: 'top-left',
		outputMode: 'compact',
		pauseAnimations: true,
		clearOnCopy: true,
		includeComponentContext: false,
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
