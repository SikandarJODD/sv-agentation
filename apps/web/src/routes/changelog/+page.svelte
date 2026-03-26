<script lang="ts">
	import { MetaTags, type MetaTagsProps } from 'svelte-meta-tags';
	import { Link } from '$lib/components/markdown';

	const releases = [
		{
			version: '0.2.5',
			date: 'March 26, 2026',
			notes: [
				'Hovering a saved note now previews the exact target area with outline and highlight overlays.',
				'Marker icons reset more cleanly after save and cancel.',
				'Add, save, cancel, and delete flows now close with smoother fade-out motion.'
			]
		},
		{
			version: '0.2.4',
			date: 'March 26, 2026',
			notes: [
				'Toolbar open and close transitions are smoother and stay anchored during width changes.',
				'The floating settings layout was simplified and made more stable.',
				'Toolbar internals and controller updates were cleaned up to remove redundant code.'
			]
		},
		{
			version: '0.2.3',
			date: 'March 26, 2026',
			notes: [
				'Persisted props now sync into local storage without locking the toolbar UI.',
				'Repeated parent rerenders no longer overwrite user changes.'
			]
		},
		{
			version: '0.2.2',
			date: 'March 24, 2026',
			notes: [
				'Explicit props now override saved toolbar settings correctly.',
				'Toolbar position now stays correct after load and resize.'
			]
		},
		{
			version: '0.2.1',
			date: 'March 17, 2026',
			notes: [
				'Notes now stay separate for each route automatically.',
				'The settings panel became smaller and easier to use.',
				'Source links in the demo app now open from the right workspace.'
			]
		},
		{
			version: '0.2.0',
			date: 'March 17, 2026',
			notes: [
				'Added compact, standard, detailed, and forensic output modes.',
				'Added more page context, component context, and computed style capture.',
				'Added settings and local lifecycle callbacks.'
			]
		},
		{
			version: '0.1.0',
			date: 'March 17, 2026',
			notes: [
				'Split the package into smaller controller, utility, and UI files.',
				'Added docs and the first round of package tests.'
			]
		},
		{
			version: '0.0.1',
			date: 'March 15, 2026',
			notes: ['First release with source inspection, notes, and markdown copy.']
		}
	];

	const siteUrl = 'https://sv-agentation.com';
	const metaTags: MetaTagsProps = {
		title: 'Changelog | Svelte Agentation',
		description: 'Simple release notes for Svelte Agentation.',
		canonical: `${siteUrl}/changelog`,
		openGraph: {
			type: 'website',
			url: `${siteUrl}/changelog`,
			title: 'Changelog | Svelte Agentation',
			description: 'Simple release notes for Svelte Agentation.',
			siteName: 'Svelte Agentation'
		},
		twitter: {
			cardType: 'summary',
			title: 'Changelog | Svelte Agentation',
			description: 'Simple release notes for Svelte Agentation.'
		}
	};
</script>

<MetaTags {...metaTags} />

<main class="min-h-screen bg-background px-5 py-10 text-foreground sm:px-6 sm:py-12">
	<div class="mx-auto w-full max-w-3xl">
		<header class="space-y-2">
			<h1 class="text-[2rem] font-semibold tracking-tight text-foreground sm:text-[2.2rem]">
				Changelog
			</h1>
			<p class="text-sm text-muted-foreground">Simple release notes for each version.</p>
			<Link class="text-sm" href="/">Back to home</Link>
		</header>

		<div class="mt-8 grid gap-4">
			{#each releases as release}
				<article class="rounded-2xl border border-border bg-card/30 p-5">
					<div class="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
						<h2 class="text-lg font-semibold text-foreground">{release.version}</h2>
						<p class="text-sm text-muted-foreground">{release.date}</p>
					</div>

					<ul class="mt-4 grid gap-2 pl-5 text-sm leading-6 text-muted-foreground">
						{#each release.notes as note}
							<li>{note}</li>
						{/each}
					</ul>
				</article>
			{/each}
		</div>
	</div>
</main>
