<script lang="ts">
	import { onMount } from 'svelte';

	import {
		INSPECTOR_ACTIVE_CHANGE_EVENT,
		INSPECTOR_BLOCKED_INTERACTION_EVENT,
		type InspectorActiveChangeDetail,
		type InspectorBlockedInteractionDetail
	} from '$lib/copy-open';
	import HoverSourceCard from '$lib/interesting-codes/hover-source-card.svelte';

	let demoClicks = $state(0);
	let demoSubscribed = $state(false);
	let blockFeedbackTick = $state(0);
	let blockFeedbackVisible = $state(false);
	let freezeDemoRunning = $state(true);

	let interactionDemoElement: HTMLElement | null = null;
	let blockFeedbackResetTimer: ReturnType<typeof setTimeout> | null = null;

	const clearBlockFeedbackResetTimer = () => {
		if (blockFeedbackResetTimer === null) return;
		clearTimeout(blockFeedbackResetTimer);
		blockFeedbackResetTimer = null;
	};

	onMount(() => {
		const handleBlockedInteraction = (event: Event) => {
			if (!interactionDemoElement) return;

			const { target } = (event as CustomEvent<InspectorBlockedInteractionDetail>).detail;
			if (!interactionDemoElement.contains(target)) return;

			blockFeedbackTick += 1;
			blockFeedbackVisible = true;
			clearBlockFeedbackResetTimer();
			blockFeedbackResetTimer = setTimeout(() => {
				blockFeedbackVisible = false;
				blockFeedbackResetTimer = null;
			}, 1100);
		};
		const handleInspectorActiveChange = (event: Event) => {
			const { active } = (event as CustomEvent<InspectorActiveChangeDetail>).detail;
			freezeDemoRunning = active;
		};

		window.addEventListener(
			INSPECTOR_BLOCKED_INTERACTION_EVENT,
			handleBlockedInteraction as EventListener
		);
		window.addEventListener(
			INSPECTOR_ACTIVE_CHANGE_EVENT,
			handleInspectorActiveChange as EventListener
		);

		return () => {
			window.removeEventListener(
				INSPECTOR_BLOCKED_INTERACTION_EVENT,
				handleBlockedInteraction as EventListener
			);
			window.removeEventListener(
				INSPECTOR_ACTIVE_CHANGE_EVENT,
				handleInspectorActiveChange as EventListener
			);
			clearBlockFeedbackResetTimer();
		};
	});
</script>

<main class="page">
	<div class="browser">
		<div class="browser-bar">
			<div class="dots">
				<span></span>
				<span></span>
				<span></span>
			</div>
			<span class="address text-xs text-orange-400">Demo Playground</span>
		</div>

		<div class="browser-body playground-container">
			<HoverSourceCard />

			<section
				aria-labelledby="pause-demo-title"
				class:pause-demo-frozen={!freezeDemoRunning}
				class="pause-demo"
			>
				<div class="pause-demo-heading">
					<h2 id="pause-demo-title">Animation pause demo</h2>
					<div aria-hidden="true" class="pause-demo-rule"></div>
				</div>

				<p class="demo-description">
					{#if freezeDemoRunning}
						Click <span class="demo-inline-control">||</span> in the toolbar to freeze this animation.
					{:else}
						Click the toolbar play button to resume this animation.
					{/if}
				</p>

				<div aria-hidden="true" class="pause-demo-stage">
					<div class="pause-demo-track">
						<div class:paused={!freezeDemoRunning} class="pause-demo-runner"></div>
					</div>
				</div>
			</section>

			<section
				bind:this={interactionDemoElement}
				aria-labelledby="interaction-demo-title"
				class:blocked-demo={blockFeedbackVisible}
				class="interaction-demo"
			>
				{#if blockFeedbackTick > 0}
					{#key blockFeedbackTick}
						<div aria-hidden="true" class="demo-blocked-flash"></div>
					{/key}
				{/if}

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
						Clicked {demoClicks}
						{demoClicks === 1 ? 'time' : 'times'}
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

				<div aria-live="polite" class="demo-feedback">
					{#if blockFeedbackVisible}
						{#key blockFeedbackTick}
							<span class="demo-feedback-badge">Interaction blocked by inspector</span>
						{/key}
					{/if}
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

	.pause-demo,
	.interaction-demo {
		position: relative;
		display: grid;
		gap: 1rem;
		padding: 1.2rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 20px;
		background:
			linear-gradient(135deg, rgba(255, 255, 255, 0.05), transparent 55%), rgba(255, 255, 255, 0.02);
		overflow: hidden;
		transition:
			border-color 180ms ease,
			box-shadow 180ms ease,
			transform 180ms ease;
	}

	.pause-demo.pause-demo-frozen {
		border-color: rgba(98, 127, 255, 0.3);
		box-shadow:
			0 0 0 1px rgba(98, 127, 255, 0.12),
			0 20px 40px rgba(72, 102, 235, 0.12);
	}

	.interaction-demo.blocked-demo {
		border-color: rgba(242, 159, 103, 0.42);
		box-shadow:
			0 0 0 1px rgba(242, 159, 103, 0.16),
			0 24px 46px rgba(242, 159, 103, 0.14);
		transform: translateY(-1px);
	}

	.demo-blocked-flash {
		position: absolute;
		inset: -1px;
		border-radius: inherit;
		border: 1px solid rgba(242, 159, 103, 0.48);
		box-shadow:
			0 0 0 0 rgba(242, 159, 103, 0.22),
			inset 0 0 0 1px rgba(242, 159, 103, 0.18);
		pointer-events: none;
		animation: demo-blocked-flash 680ms cubic-bezier(0.19, 1, 0.22, 1);
	}

	.pause-demo-heading {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.pause-demo-heading h2 {
		margin: 0;
		font-size: clamp(1.05rem, 1.9vw, 1.2rem);
		font-weight: 600;
		white-space: nowrap;
	}

	.pause-demo-rule {
		height: 1px;
		flex: 1;
		background: linear-gradient(90deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04));
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

	.demo-feedback {
		min-height: 1.8rem;
	}

	.demo-feedback-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem 0.7rem;
		border: 1px solid rgba(242, 159, 103, 0.28);
		border-radius: 999px;
		background: rgba(242, 159, 103, 0.12);
		color: #ffd7b8;
		box-shadow: 0 12px 24px rgba(242, 159, 103, 0.12);
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.01em;
		animation: demo-feedback-badge 360ms cubic-bezier(0.2, 0.88, 0.24, 1);
	}

	.demo-inline-control {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.6rem;
		padding: 0.05rem 0.35rem;
		margin: 0 0.12rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.05);
		color: #f6f1e8;
		font-size: 0.8em;
		font-weight: 700;
		letter-spacing: 0.04em;
	}

	.pause-demo-stage {
		padding: 0.4rem 0 0.15rem;
	}

	.pause-demo-track {
		position: relative;
		height: 6px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.08);
		overflow: hidden;
	}

	.pause-demo-runner {
		position: absolute;
		top: 50%;
		left: 0;
		width: clamp(7rem, 30%, 12.5rem);
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, #6f89ff, #6c8dff 55%, #7ea0ff);
		box-shadow:
			0 0 0 1px rgba(122, 149, 255, 0.18),
			0 0 22px rgba(108, 141, 255, 0.28);
		transform: translate(-100%, -50%);
		animation: pause-demo-slide 2200ms cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
		will-change: transform;
	}

	.pause-demo-runner.paused {
		animation-play-state: paused;
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

	@keyframes demo-blocked-flash {
		0% {
			opacity: 0;
			transform: scale(0.985);
			box-shadow:
				0 0 0 0 rgba(242, 159, 103, 0.28),
				inset 0 0 0 0 rgba(242, 159, 103, 0.18);
		}

		28% {
			opacity: 1;
			transform: scale(1);
			box-shadow:
				0 0 0 10px rgba(242, 159, 103, 0.14),
				inset 0 0 0 1px rgba(242, 159, 103, 0.24);
		}

		100% {
			opacity: 0;
			transform: scale(1.018);
			box-shadow:
				0 0 0 18px rgba(242, 159, 103, 0),
				inset 0 0 0 1px rgba(242, 159, 103, 0);
		}
	}

	@keyframes demo-feedback-badge {
		0% {
			opacity: 0;
			transform: translateY(6px) scale(0.96);
		}

		100% {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes pause-demo-slide {
		0% {
			transform: translate(-100%, -50%);
		}

		100% {
			transform: translate(210%, -50%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pause-demo,
		.interaction-demo,
		.demo-button,
		.pause-demo-runner,
		.demo-blocked-flash,
		.demo-feedback-badge {
			animation: none;
			transition: none;
		}
	}

	@media (max-width: 640px) {
		.browser-body {
			padding: 3rem 1.25rem 2rem;
		}

		.pause-demo-heading {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.5rem;
		}

		.pause-demo-rule {
			width: 100%;
		}

		.demo-button {
			width: 100%;
		}
	}
</style>
