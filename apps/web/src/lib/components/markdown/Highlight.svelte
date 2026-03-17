<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "$lib/utils";

	type HighlightTone = "aqua" | "blue" | "green" | "yellow" | "coral";

	type ComponentProps = {
		tone?: HighlightTone;
		class?: string;
		children?: Snippet;
		[prop: string]: unknown;
	};

	const toneClasses: Record<HighlightTone, string> = {
		aqua: "bg-cyan-100 text-cyan-700 dark:bg-cyan-400/16 dark:text-cyan-200",
		blue: "bg-blue-100 text-blue-700 dark:bg-blue-400/16 dark:text-blue-200",
		green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/16 dark:text-emerald-200",
		yellow: "bg-amber-100 text-amber-800 dark:bg-amber-300/16 dark:text-amber-100",
		coral: "bg-rose-100 text-rose-700 dark:bg-rose-300/16 dark:text-rose-100",
	};

	const {
		tone = "aqua",
		children,
		class: className = "",
		...restProps
	}: ComponentProps = $props();
</script>

<span
	{...restProps}
	class={cn(
		"inline-flex items-center rounded-[2px] px-2 py-0.5 text-[0.78em] font-medium",
		toneClasses[tone],
		className
	)}
>
	{@render children?.()}
</span>
