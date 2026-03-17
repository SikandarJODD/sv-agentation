<script lang="ts">
	import { MetaTags, type MetaTagsProps } from 'svelte-meta-tags';
	import { CodeSpan, Highlight, Link } from '$lib/components/markdown';

	const releases = [
		{
			version: '0.2.1',
			date: 'March 17, 2026',
			sections: [
				{
					label: 'Improved',
					items: [
						'Made route-scoped note sessions work automatically without extra app-shell key wiring.',
						'Polished the floating settings UI with a denser layout, compact output mode cycling, and calmer accordion motion.',
						'Fixed local editor-opening in the demo app by resolving source links against the correct app workspace root.'
					]
				},
				{
					label: 'Added',
					items: [
						'Added internal pathname tracking so page notes stay isolated by default.',
						'Added regression coverage for stale note leakage across routes and offscreen marker visibility.'
					]
				}
			]
		},
		{
			version: '0.2.0',
			date: 'March 17, 2026',
			sections: [
				{
					label: 'Improved',
					items: [
						'Added compact, standard, detailed, and forensic copy modes based on the Agentation-style demo outputs.',
						'Captured stable page context, selector paths, component context, nearby text, and forensic computed styles at save time.',
						'Added settings for output mode, animation pause, clear-on-copy, component context, and computed-style inclusion.'
					]
				},
				{
					label: 'Added',
					items: [
						'Added annotation lifecycle and copy callbacks for local integrations.',
						'Added fixture tests that compare generated output against the demo markdown references.'
					]
				}
			]
		},
		{
			version: '0.1.0',
			date: 'March 17, 2026',
			sections: [
				{
					label: 'Improved',
					items: [
						'Refactored the package into smaller controller, utility, and UI modules.',
						'Added code-structure docs and a first pass of package tests.'
					]
				},
				{
					label: 'Removed',
					items: ['Dropped old legacy storage compatibility from the pre-release copy-open phase.']
				}
			]
		},
		{
			version: '0.0.1',
			date: 'March 15, 2026',
			sections: [
				{
					label: 'Initial',
					items: [
						'Shipped the first Svelte Agentation alpha with source-aware inspection, note annotations, and markdown copy.'
					]
				}
			]
		}
	];

	const siteUrl = 'https://sv-agentation.com';
	const metaTags: MetaTagsProps = {
		title: 'Changelog • Svelte Agentation',
		description: 'Release history for Svelte Agentation.',
		canonical: `${siteUrl}/changelog`,
		openGraph: {
			type: 'website',
			url: `${siteUrl}/changelog`,
			title: 'Changelog • Svelte Agentation',
			description: 'Release history for Svelte Agentation.',
			siteName: 'Svelte Agentation'
		},
		twitter: {
			cardType: 'summary',
			title: 'Changelog • Svelte Agentation',
			description: 'Release history for Svelte Agentation.'
		}
	};
</script>

<MetaTags {...metaTags} />

<main class="min-h-screen bg-background px-5 py-10 text-foreground sm:px-6 sm:py-12">
	<div class="mx-auto w-full max-w-[44rem]">
		<header class="space-y-2">
			<h1 class="font-serif text-[2.1rem] tracking-tight text-foreground sm:text-[2.35rem]">
				Changelog
			</h1>
			<p class="text-[1rem] text-muted-foreground">Release history</p>
			<div class="pt-1">
				<Link class="text-sm" href="/">Back to home</Link>
			</div>
		</header>

		<section class="mt-12">
			{#each releases as release, index}
				<article class:entry-spaced={index > 0} class="release-entry">
					<div class="release-head">
						<div class="release-meta">
							<span class="release-version">{release.version}</span>
							<span class="release-date">{release.date}</span>
						</div>
						<div class="release-rule"></div>
					</div>

					<div class="release-body">
						{#if release.version === '0.2.1'}
							<p class="release-note">
								<Highlight>Current patch</Highlight>
								<span>
									This release focuses on making <CodeSpan>Agentation</CodeSpan> easier to mount,
									keeping route sessions isolated by default, and polishing the compact toolbar
									settings surface.
								</span>
							</p>
						{/if}

						{#each release.sections as section}
							<section class="section-block">
								<h2 class="section-label">{section.label}</h2>
								<ul class="section-list">
									{#each section.items as item}
										<li>{item}</li>
									{/each}
								</ul>
							</section>
						{/each}
					</div>
				</article>
			{/each}
		</section>
	</div>
</main>

<style>
	.release-entry {
		display: grid;
		gap: 1.2rem;
	}

	.release-entry.entry-spaced {
		margin-top: 3rem;
	}

	.release-head {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 1rem;
	}

	.release-meta {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.8rem;
	}

	.release-version {
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.03em;
	}

	.release-date {
		font-size: 1rem;
		color: var(--color-muted-foreground);
	}

	.release-rule {
		height: 1px;
		background: var(--color-border);
	}

	.release-body {
		display: grid;
		gap: 1.25rem;
	}

	.release-note {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.55rem;
		margin: 0;
		color: var(--color-muted-foreground);
		font-size: 0.98rem;
		line-height: 1.65;
	}

	.section-block {
		display: grid;
		gap: 0.55rem;
	}

	.section-label {
		font-size: 0.82rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--color-muted-foreground);
	}

	.section-list {
		display: grid;
		gap: 0.55rem;
		margin: 0;
		padding-left: 1.15rem;
		color: var(--color-foreground);
		font-size: 1.02rem;
		line-height: 1.65;
	}

	.section-list li {
		/* color: color-mix(in srgb, var(--color-muted-foreground) 72%, transparent); */
		font-size: 0.96rem;
		font-weight: 400;
		/* color: var(--color-muted-foreground) */
	}
	.section-list li::marker {
		color: color-mix(in srgb, var(--color-muted-foreground) 72%, transparent);
	}

	@media (max-width: 640px) {
		.release-head {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}

		.release-version {
			font-size: 1.45rem;
		}
	}
</style>
