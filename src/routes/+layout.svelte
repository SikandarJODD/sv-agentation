<script lang="ts">
	import './layout.css';
	import { browser, dev } from '$app/environment';
	import { ElementSourceInspector } from '$lib/copy-open';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from 'svelte-sonner';

	const workspaceRoot = 's:/advance_svelte/exp/svelte-learning';

	let { children } = $props();
</script>

<ModeWatcher defaultMode="dark" />
<!-- <Toaster position="top-center" /> -->

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}

{#if browser && dev}
	<ElementSourceInspector  {workspaceRoot} />
{/if}
