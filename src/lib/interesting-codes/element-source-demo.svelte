<script lang="ts">
	import { onMount } from 'svelte';
	import { ElementSourceController } from '$lib/interesting-codes/element-source.svelte';
	import ElementSourceNestedCard from '$lib/interesting-codes/element-source-nested-card.svelte';

	const controller = new ElementSourceController();

	let bound_button: HTMLButtonElement | null = null;
	let playground_element: HTMLElement | null = null;
	let direct_example_ready = false;

	const directSnippet = `let buttonElement: HTMLButtonElement | null = null;
const controller = new ElementSourceController();

<button bind:this={buttonElement}>
  Inspect me
</button>

<button onclick={() => controller.inspect(buttonElement)}>
  Run resolveElementInfo()
</button>`;

	const eventSnippet = `const handleDocumentClick = async (event: MouseEvent) => {
  if (!controller.inspecting) return;
  await controller.inspectFromEventTarget(event.target);
};

<svelte:document onclick={handleDocumentClick} />`;

	const helperSnippet = `const info = await controller.inspect(element);
// controller.info?.source
// controller.info?.componentName
// controller.info?.stack
// controller.formattedStack`;

	onMount(() => {
		direct_example_ready = true;
	});

	function formatSourceLabel() {
		if (!controller.info?.source) {
			return 'No source location returned.';
		}

		const { filePath, lineNumber, columnNumber } = controller.info.source;
		return `${filePath}:${lineNumber ?? '?'}:${columnNumber ?? '?'}`;
	}

	async function inspectBoundButton() {
		controller.setTarget(bound_button);
		await controller.inspect(bound_button);
	}

	async function handleDocumentClick(event: MouseEvent) {
		if (!controller.inspecting) return;

		const target = event.target;
		if (!(target instanceof Element)) {
			await controller.inspectFromEventTarget(target);
			return;
		}

		if (target.closest('[data-inspector-ui]')) return;
		if (!playground_element?.contains(target)) return;

		event.preventDefault();
		event.stopPropagation();

		await controller.inspectFromEventTarget(target);
	}
</script>

<svelte:document onclick={handleDocumentClick} />

<section class="page-shell">
	<div class="hero">
		<p class="hero-kicker">Svelte 5 + TypeScript + runes</p>
		<h1>Learn `element-source` by inspecting real DOM elements</h1>
		<p class="hero-copy">
			The library works by taking a real DOM element from `bind:this` or `event.target`, then resolving
			its file path, line, column, component name, and stack. This playground keeps that logic inside a
			class-based rune controller so the examples stay tidy.
		</p>
		<p class="hero-note">
			Use this as a development-time debugging aid. It depends on Svelte source metadata and should not be
			treated as production-guaranteed behavior.
		</p>
	</div>

	<div class="playground-grid">
		<div class="playground" bind:this={playground_element}>
			<section class="demo-card">
				<div class="section-head">
					<p class="section-label">Example 1</p>
					<h2>`bind:this` gives you a stable source element</h2>
				</div>

				<div class="example-stack">
					<button class="inspect-target" bind:this={bound_button} type="button">
						Source target button
					</button>

					<div class="action-row">
						<button class="action-primary" type="button" onclick={inspectBoundButton}>
							Inspect the bound button
						</button>
						<span class="micro-copy">
							{#if direct_example_ready}
								This is the most direct Svelte pattern.
							{:else}
								Waiting for the element to mount...
							{/if}
						</span>
					</div>
				</div>

				<pre class="code-sample"><code>{directSnippet}</code></pre>
			</section>

			<section class="demo-card" data-inspector-ui>
				<div class="section-head">
					<p class="section-label">Example 2</p>
					<h2>Inspector mode can read `event.target` from clicks</h2>
				</div>

				<div class="action-row">
					<button
						class:active-toggle={controller.inspecting}
						class="action-secondary"
						type="button"
						onclick={() => controller.toggleInspecting()}
					>
						{controller.inspecting ? 'Stop click inspector' : 'Start click inspector'}
					</button>
					<button class="action-ghost" type="button" onclick={() => controller.clear()}>
						Clear result
					</button>
				</div>

				<p class="micro-copy">
					When inspector mode is on, click anything inside this playground except the control buttons.
				</p>

				<pre class="code-sample"><code>{eventSnippet}</code></pre>
			</section>

			<section class="demo-card">
				<div class="section-head">
					<p class="section-label">Example 3</p>
					<h2>Nested component stack example</h2>
				</div>

				<ElementSourceNestedCard {controller} />
			</section>

			<section class="demo-card">
				<div class="section-head">
					<p class="section-label">Example 4</p>
					<h2>How the controller maps to the library APIs</h2>
				</div>

				<p class="micro-copy">
					The controller internally calls `resolveElementInfo`, `resolveSource`, `resolveStack`,
					`resolveComponentName`, and `formatStack`.
				</p>

				<pre class="code-sample"><code>{helperSnippet}</code></pre>
			</section>
		</div>

		<aside class="result-panel" data-inspector-ui>
			<div class="result-head">
				<p class="section-label">Live result</p>
				<h2>Inspection output</h2>
			</div>

			{#if controller.loading}
				<p class="status status-loading">Resolving source metadata...</p>
			{:else if controller.error}
				<p class="status status-error">{controller.error}</p>
			{:else if controller.info}
				<div class="result-grid">
					<div class="result-row">
						<span class="result-key">`tagName`</span>
						<code>{controller.info.tagName}</code>
					</div>
					<div class="result-row">
						<span class="result-key">`resolveComponentName()`</span>
						<code>{controller.info.componentName ?? 'null'}</code>
					</div>
					<div class="result-row">
						<span class="result-key">`resolveSource()`</span>
						<code>{formatSourceLabel()}</code>
					</div>
					<div class="result-row">
						<span class="result-key">`resolveStack()`</span>
						<code>{controller.info.stack.length} frames</code>
					</div>
				</div>

				<div class="stack-output">
					<h3>Formatted stack</h3>
					<pre><code>{controller.formattedStack}</code></pre>
				</div>
			{:else}
				<p class="status">Inspect a bound element, toggle click inspector mode, or use the nested card.</p>
			{/if}
		</aside>
	</div>
</section>

<style>
	:global(body) {
		margin: 0;
		background:
			radial-gradient(circle at top, rgba(251, 191, 36, 0.2), transparent 30%),
			linear-gradient(180deg, #fffdf6, #f8fafc 44%, #eef2ff);
		color: #0f172a;
		font-family:
			'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Palatino, 'Times New Roman', serif;
	}

	.page-shell {
		max-width: 1200px;
		margin: 0 auto;
		padding: 3rem 1.25rem 4rem;
	}

	.hero {
		max-width: 50rem;
		margin-bottom: 2rem;
	}

	.hero-kicker,
	.section-label {
		margin: 0;
		font-size: 0.78rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #9a3412;
	}

	h1 {
		margin: 0.65rem 0 0;
		font-size: clamp(2.5rem, 5vw, 4.5rem);
		line-height: 0.95;
		letter-spacing: -0.04em;
	}

	h2 {
		margin: 0.45rem 0 0;
		font-size: 1.35rem;
		line-height: 1.2;
	}

	.hero-copy,
	.hero-note,
	.micro-copy {
		margin: 1rem 0 0;
		font-family: 'Trebuchet MS', 'Gill Sans', sans-serif;
		line-height: 1.65;
		color: #334155;
	}

	.hero-note {
		max-width: 45rem;
		padding: 0.95rem 1rem;
		border-left: 4px solid #f59e0b;
		background: rgba(255, 255, 255, 0.65);
		border-radius: 0.85rem;
	}

	.playground-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.9fr);
		gap: 1.5rem;
		align-items: start;
	}

	.playground,
	.result-panel {
		display: grid;
		gap: 1rem;
	}

	.demo-card,
	.result-panel {
		padding: 1.2rem;
		border-radius: 1.4rem;
		border: 1px solid rgba(15, 23, 42, 0.12);
		background: rgba(255, 255, 255, 0.88);
		box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
		backdrop-filter: blur(10px);
	}

	.example-stack {
		display: grid;
		gap: 1rem;
	}

	.inspect-target {
		justify-self: start;
		padding: 1.1rem 1.2rem;
		border: 1px dashed #0f766e;
		border-radius: 1rem;
		background: linear-gradient(135deg, rgba(204, 251, 241, 0.92), rgba(186, 230, 253, 0.85));
		color: #134e4a;
		font-size: 1rem;
		font-weight: 800;
		cursor: pointer;
	}

	.action-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
	}

	.action-primary,
	.action-secondary,
	.action-ghost {
		padding: 0.82rem 1rem;
		border-radius: 999px;
		font-family: 'Trebuchet MS', 'Gill Sans', sans-serif;
		font-size: 0.95rem;
		font-weight: 700;
		cursor: pointer;
		transition:
			transform 140ms ease,
			box-shadow 140ms ease,
			background 140ms ease;
	}

	.action-primary:hover,
	.action-secondary:hover,
	.action-ghost:hover,
	.inspect-target:hover {
		transform: translateY(-1px);
	}

	.action-primary {
		border: none;
		background: linear-gradient(135deg, #ea580c, #c2410c);
		color: white;
		box-shadow: 0 12px 24px rgba(194, 65, 12, 0.22);
	}

	.action-secondary {
		border: 1px solid rgba(15, 23, 42, 0.14);
		background: linear-gradient(135deg, #f8fafc, #e2e8f0);
		color: #0f172a;
	}

	.active-toggle {
		background: linear-gradient(135deg, #0f766e, #155e75);
		color: white;
		border-color: transparent;
	}

	.action-ghost {
		border: 1px solid rgba(15, 23, 42, 0.14);
		background: white;
		color: #475569;
	}

	.code-sample,
	.stack-output pre {
		margin: 0;
		padding: 1rem;
		border-radius: 1rem;
		background: #0f172a;
		color: #e2e8f0;
		overflow-x: auto;
		font-family:
			'IBM Plex Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
		font-size: 0.84rem;
		line-height: 1.6;
	}

	.result-head {
		padding-bottom: 0.85rem;
		border-bottom: 1px solid rgba(15, 23, 42, 0.08);
	}

	.result-grid {
		display: grid;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.result-row {
		display: grid;
		gap: 0.35rem;
		padding: 0.85rem;
		border-radius: 1rem;
		background: rgba(248, 250, 252, 0.9);
	}

	.result-key {
		font-family: 'Trebuchet MS', 'Gill Sans', sans-serif;
		font-size: 0.82rem;
		font-weight: 700;
		color: #64748b;
	}

	code {
		word-break: break-word;
		font-family:
			'IBM Plex Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
		font-size: 0.84rem;
	}

	.stack-output {
		margin-top: 1rem;
	}

	.stack-output h3 {
		margin: 0 0 0.75rem;
		font-size: 1rem;
	}

	.status {
		margin: 1rem 0 0;
		padding: 0.95rem 1rem;
		border-radius: 1rem;
		background: rgba(248, 250, 252, 0.95);
		font-family: 'Trebuchet MS', 'Gill Sans', sans-serif;
		line-height: 1.6;
		color: #334155;
	}

	.status-loading {
		background: rgba(254, 249, 195, 0.75);
		color: #854d0e;
	}

	.status-error {
		background: rgba(254, 226, 226, 0.85);
		color: #991b1b;
	}

	@media (max-width: 900px) {
		.playground-grid {
			grid-template-columns: 1fr;
		}

		h1 {
			line-height: 1;
		}
	}
</style>
