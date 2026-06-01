<script lang="ts">
	// Render real annotatable content inside an open shadow root so the inspector
	// can be tried against shadow-DOM elements directly on this page.
	const mountShadowContent = (node: HTMLElement) => {
		if (node.shadowRoot) return;

		const shadow = node.attachShadow({ mode: 'open' });
		shadow.innerHTML = `
			<style>
				:host {
					display: block;
					color: inherit;
				}
				.card {
					display: grid;
					gap: 0.75rem;
					border: 1px dashed color-mix(in srgb, currentColor 25%, transparent);
					border-radius: 0.75rem;
					padding: 1rem;
					background: color-mix(in srgb, currentColor 4%, transparent);
				}
				.eyebrow {
					margin: 0;
					font-size: 0.7rem;
					letter-spacing: 0.14em;
					text-transform: uppercase;
					opacity: 0.6;
				}
				h3 {
					margin: 0;
					font-size: 0.95rem;
					font-weight: 600;
				}
				p {
					margin: 0;
					font-size: 0.85rem;
					line-height: 1.5;
					opacity: 0.8;
				}
				button {
					justify-self: start;
					border: 1px solid color-mix(in srgb, currentColor 30%, transparent);
					border-radius: 0.5rem;
					padding: 0.4rem 0.85rem;
					font: inherit;
					font-size: 0.8rem;
					color: inherit;
					background: color-mix(in srgb, currentColor 8%, transparent);
					cursor: pointer;
				}
			</style>
			<div class="card">
				<p class="eyebrow">Open shadow root</p>
				<h3>Annotate me — I live in the shadow DOM</h3>
				<p>
					This card, heading, and button are rendered inside an open shadow root. Press
					<strong>i</strong> to activate the inspector, then hover and click any element here.
				</p>
				<button type="button">Shadow button</button>
			</div>
		`;
	};
</script>

<div use:mountShadowContent></div>
