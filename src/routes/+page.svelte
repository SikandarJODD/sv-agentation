<script lang="ts">
	import HoverSourceCard from '$lib/interesting-codes/hover-source-card.svelte';

	let demoClicks = $state(0);
	let demoSubscribed = $state(false);
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

			<section class="interaction-demo" aria-labelledby="interaction-demo-title">
				<div class="demo-copy">
					<p class="demo-eyebrow">Inspector Demo</p>
					<h2 id="interaction-demo-title">Block page interactions</h2>
					<p class="demo-description">
						With inspect mode on and this setting enabled, clicking these controls should annotate
						them instead of firing their normal action.
					</p>
				</div>

				<div class="demo-actions">
					<button class="demo-button primary-demo" type="button" onclick={() => demoClicks++}>
						Clicked {demoClicks} {demoClicks === 1 ? 'time' : 'times'}
					</button>

					<button
						aria-pressed={demoSubscribed}
						class="demo-button secondary-demo"
						type="button"
						onclick={() => (demoSubscribed = !demoSubscribed)}
					>
						{demoSubscribed ? 'Subscribed' : 'Subscribe'}
					</button>
				</div>
			</section>
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
		display: grid;
		gap: 1.5rem;
		padding: 4.5rem 2rem 3rem;
	}

	.interaction-demo {
		display: grid;
		gap: 1rem;
		padding: 1.2rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 20px;
		background:
			linear-gradient(135deg, rgba(255, 255, 255, 0.05), transparent 55%),
			rgba(255, 255, 255, 0.02);
	}

	.demo-copy {
		display: grid;
		gap: 0.45rem;
		max-width: 42rem;
	}

	.demo-eyebrow {
		margin: 0;
		color: #f29f67;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.interaction-demo h2 {
		margin: 0;
		font-size: clamp(1.1rem, 2vw, 1.35rem);
	}

	.demo-description {
		margin: 0;
		color: rgba(242, 236, 223, 0.76);
		font-size: 0.95rem;
		line-height: 1.5;
	}

	.demo-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.demo-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 11rem;
		padding: 0.8rem 1rem;
		border-radius: 999px;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			transform 180ms ease,
			box-shadow 180ms ease,
			background 180ms ease,
			border-color 180ms ease;
	}

	.demo-button:hover {
		transform: translateY(-1px);
	}

	.primary-demo {
		border: 1px solid rgba(242, 159, 103, 0.3);
		background: linear-gradient(135deg, rgba(242, 159, 103, 0.28), rgba(242, 159, 103, 0.12));
		color: #fff3e8;
		box-shadow: 0 16px 30px rgba(242, 159, 103, 0.14);
	}

	.secondary-demo {
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: rgba(255, 255, 255, 0.04);
		color: #f2ecdf;
	}

	.secondary-demo[aria-pressed='true'] {
		border-color: rgba(122, 211, 165, 0.35);
		background: linear-gradient(135deg, rgba(122, 211, 165, 0.2), rgba(122, 211, 165, 0.08));
		color: #f5fff9;
	}

	@media (max-width: 640px) {
		.browser-body {
			padding: 3rem 1.25rem 2rem;
		}

		.demo-button {
			width: 100%;
		}
	}
</style>
