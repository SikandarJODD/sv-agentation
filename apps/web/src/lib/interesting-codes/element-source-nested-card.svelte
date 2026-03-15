<script lang="ts">
	import type { ElementSourceController } from '$lib/interesting-codes/element-source.svelte';

	interface Props {
		controller: ElementSourceController;
	}

	let { controller }: Props = $props();
	let card_element: HTMLElement | null = null;
</script>

<article class="nested-card" bind:this={card_element}>
	<div class="nested-copy">
		<p class="eyebrow">Nested component</p>
		<h3>Inspect an element rendered in a child Svelte component</h3>
		<p>
			This card lives in its own `.svelte` file, so inspecting it should usually show a deeper
			component stack than the direct parent example.
		</p>
	</div>

	<div class="nested-actions">
		<button class="nested-button" type="button" onclick={() => controller.inspect(card_element)}>
			Inspect this child card
		</button>
		<span class="nested-hint"
			>Uses `controller.inspect(cardElement)` inside the child component.</span
		>
	</div>
</article>

<style>
	.nested-card {
		display: grid;
		gap: 1rem;
		padding: 1.25rem;
		border-radius: 1.25rem;
		border: 1px solid rgba(15, 23, 42, 0.12);
		background:
			radial-gradient(circle at top left, rgba(251, 191, 36, 0.2), transparent 40%),
			linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92));
		box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
	}

	.eyebrow {
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #9a3412;
	}

	h3 {
		margin-top: 0.35rem;
		font-size: 1.05rem;
		line-height: 1.35;
		color: #0f172a;
	}

	p {
		margin-top: 0.5rem;
		line-height: 1.6;
		color: #334155;
	}

	.nested-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
	}

	.nested-button {
		padding: 0.8rem 1rem;
		border: none;
		border-radius: 999px;
		background: linear-gradient(135deg, #0f766e, #155e75);
		color: white;
		font-weight: 700;
		cursor: pointer;
	}

	.nested-hint {
		font-size: 0.92rem;
		color: #475569;
	}
</style>
