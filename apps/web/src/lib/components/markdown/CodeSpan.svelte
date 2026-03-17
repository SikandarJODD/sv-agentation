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

<code
	{...restProps}
	class={cn(
		"bg-muted/55 text-foreground border-border/70 inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[0.78em]",
		className
	)}
>
	{@render children?.()}
</code>
