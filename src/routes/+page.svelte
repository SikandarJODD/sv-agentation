<script lang="ts">
	import HoverSourceCard from '$lib/interesting-codes/hover-source-card.svelte';
</script>

<main class="page">
	<div class="browser">
		<div class="browser-bar">
			<div class="dots">
				<span></span>
				<span></span>
				<span></span>
			</div>
			<span class="address text-orange-400 text-xs">Demo Playground</span>
		</div>

		<div class="browser-body playground-container">
			<HoverSourceCard />
		</div>
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #080808;
		color: #f2ecdf;
		/* font-family: Georgia, 'Times New Roman', serif; */
	}

	.page {
		min-height: 100vh;
		padding: 2rem 1rem;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent), #080808;
	}

	.browser {
		max-width: 980px;
		margin: 0 auto;
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 16px;
		background: #0a0a0a;
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.02) inset;
		overflow: hidden;
	}

	.browser-bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.9rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.dots {
		display: flex;
		gap: 0.35rem;
	}

	.dots span {
		width: 8px;
		height: 8px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.12);
	}

	.address {
		font-size: 0.95rem;
	}

	.browser-body {
		padding: 4.5rem 2rem 3rem;
	}

	@media (max-width: 640px) {
		.browser-body {
			padding: 3rem 1.25rem 2rem;
		}
	}
</style>
