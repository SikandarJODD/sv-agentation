<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "$lib/utils";

	type ComponentProps = {
		class?: string;
		children?: Snippet;
		[prop: string]: unknown;
	};

	const { children, class: className = "", ...restProps }: ComponentProps = $props();
</script>

<h1
	{...restProps}
	class={cn(
		"text-foreground font-display scroll-m-20 text-[1.7rem] leading-tight font-medium tracking-tight",
		className
	)}
>
	{@render children?.()}
</h1>
