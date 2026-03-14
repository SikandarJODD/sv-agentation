<div class="flex flex-col gap-6">
	<h1>Simple Svelte Demo</h1>
	<p class="text-lg text-muted-foreground">
		Click any element to jump straight to its source.
		<br />
		Works with Svelte.
	</p>
	<button type="button">Get started</button>
	<div class="flex w-full gap-4">
		<div class="w-2/3 border border-dashed border-muted-foreground/40 p-4">
			<p>o : open in vs code</p>
			<p>c : copy file name, line number, and column number to clipboard</p>
			<p>i : inspect toggle on/off</p>
		</div>
		<div class="w-1/3 border border-dashed border-muted-foreground/40 p-4">
			<!-- small rectangles with different size and bg colors with opacity 40 -->
			<div class="flex flex-wrap gap-2">
				<div class="h-8 w-16 bg-red-500/40"></div>
				<div class="h-8 w-24 bg-green-500/40"></div>
				<div class="h-8 w-20 bg-blue-500/40"></div>
				<div class="h-10 w-24 bg-yellow-500/40"></div>
				<div class="h-10 w-4 bg-purple-500/40"></div>
				<div class="h-10 w-32 bg-pink-500/40"></div>
			</div>
		</div>
	</div>
</div>

<style>
	h1 {
		margin: 0;
		font-size: clamp(2rem, 5vw, 3rem);
		font-style: italic;
		font-weight: 500;
		line-height: 1;
		color: #f2ecdf;
	}

	/* p {
		margin: 0;
		max-width: 28rem;
		font-size: 1.2rem;
		line-height: 1.45;
		color: rgba(242, 236, 223, 0.9);
	} */

	button {
		width: fit-content;
		padding: 0.95rem 1.3rem;
		border: none;
		background: rgba(255, 255, 255, 0.08);
		color: #f2ecdf;
		font-size: 1.05rem;
		font-family: inherit;
		cursor: pointer;
	}
</style>
