<script lang="ts">
	import './layout.css';
	import { browser, dev } from '$app/environment';
	import { ModeWatcher } from 'mode-watcher';
	import { Agentation } from 'sv-agentation';
	import { asset } from '$app/paths';

	// const workspaceRoot = 's:/advance_svelte/exp/svelte-learning';

	let { children } = $props();
</script>

<ModeWatcher defaultMode="light" />

<svelte:head><link rel="icon" href={asset('/main-favicon-light.svg')} /></svelte:head>
{@render children()}

{#if browser}
	<Agentation />
{/if}
