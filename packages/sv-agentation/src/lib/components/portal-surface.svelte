<script lang="ts">
	import { getAllContexts, mount, unmount } from 'svelte';
	import type { Snippet } from 'svelte';
	import PortalConsumer from './portal-consumer.svelte';

	let {
		target = null,
		children
	}: {
		target?: Element | null;
		children?: Snippet;
	} = $props();

	const context = getAllContexts();
	let instance: ReturnType<typeof mount> | null = null;
	const isMountedPortalTarget = (value: Element | null): value is Element =>
		typeof Element !== 'undefined' &&
		typeof document !== 'undefined' &&
		value instanceof Element &&
		document.contains(value);

	const unmountInstance = () => {
		if (!instance) return;
		unmount(instance);
		instance = null;
	};

	$effect(() => {
		const nextTarget = isMountedPortalTarget(target) ? target : null;

		if (!nextTarget) {
			unmountInstance();
			return;
		}

		instance = mount(PortalConsumer, {
			target: nextTarget,
			props: { children },
			context
		});

		return () => {
			unmountInstance();
		};
	});
</script>

{#if !isMountedPortalTarget(target)}
	{@render children?.()}
{/if}
