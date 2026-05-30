<script lang="ts">
	import { MetaTags, type MetaTagsProps } from 'svelte-meta-tags';
	import { Link } from '$lib/components/markdown';

	type ReleaseNoteType = 'new feature' | 'update' | 'fixed';

	type ReleaseGroup = {
		type: ReleaseNoteType;
		items: string[];
	};

	type Release = {
		version: string;
		date: string;
		notes: ReleaseGroup[];
	};

	const noteLabelClasses: Record<ReleaseNoteType, string> = {
		'new feature': 'text-emerald-700 dark:text-emerald-300',
		update: 'text-amber-700 dark:text-amber-300',
		fixed: 'text-sky-700 dark:text-sky-300'
	};

	const releases: Release[] = [
		{
			version: '0.3.1',
			date: 'May 30, 2026',
			notes: [
				{
					type: 'new feature',
					items: ['Added a Preview Notes panel.']
				},
				{
					type: 'update',
					items: ['Preview items now jump straight into editing.']
				},
				{
					type: 'fixed',
					items: ['Settings and preview overlays no longer conflict.']
				}
			]
		},
		{
			version: '0.3.0',
			date: 'May 27, 2026',
			notes: [
				{
					type: 'new feature',
					items: ['Added simpler public type names.']
				},
				{
					type: 'update',
					items: ['Deprecated older type aliases.', 'Simplified docs and examples for the new API.']
				}
			]
		},
		{
			version: '0.2.5',
			date: 'March 26, 2026',
			notes: [
				{
					type: 'new feature',
					items: ['Added hover previews for saved notes.']
				},
				{
					type: 'fixed',
					items: ['Marker icons reset more reliably.']
				},
				{
					type: 'update',
					items: ['Smoothed add, save, cancel, and delete transitions.']
				}
			]
		},
		{
			version: '0.2.4',
			date: 'March 26, 2026',
			notes: [
				{
					type: 'update',
					items: ['Smoothed toolbar open and close behavior.', 'Cleaned up internal toolbar code.']
				},
				{
					type: 'fixed',
					items: ['Made the floating settings layout more stable.']
				}
			]
		},
		{
			version: '0.2.3',
			date: 'March 26, 2026',
			notes: [
				{
					type: 'fixed',
					items: [
						'Local storage syncing no longer locks the toolbar.',
						'Parent rerenders no longer overwrite user changes.'
					]
				}
			]
		},
		{
			version: '0.2.2',
			date: 'March 24, 2026',
			notes: [
				{
					type: 'fixed',
					items: [
						'Explicit props now override saved settings correctly.',
						'Toolbar position stays correct after load and resize.'
					]
				}
			]
		},
		{
			version: '0.2.1',
			date: 'March 17, 2026',
			notes: [
				{
					type: 'new feature',
					items: ['Notes are now separated by route automatically.']
				},
				{
					type: 'update',
					items: ['Made the settings panel smaller and easier to use.']
				},
				{
					type: 'fixed',
					items: ['Demo source links now open from the right workspace.']
				}
			]
		},
		{
			version: '0.2.0',
			date: 'March 17, 2026',
			notes: [
				{
					type: 'new feature',
					items: [
						'Added compact, standard, detailed, and forensic output modes.',
						'Added richer page and component context capture.',
						'Added settings and local lifecycle callbacks.'
					]
				}
			]
		},
		{
			version: '0.1.0',
			date: 'March 17, 2026',
			notes: [
				{
					type: 'update',
					items: ['Split the package into smaller controller, utility, and UI files.']
				},
				{
					type: 'new feature',
					items: ['Added docs and the first package tests.']
				}
			]
		},
		{
			version: '0.0.1',
			date: 'March 15, 2026',
			notes: [
				{
					type: 'new feature',
					items: ['First release with source inspection, notes, and markdown copy.']
				}
			]
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
			<p class="text-sm text-muted-foreground">Simple release notes with grouped changes.</p>
			<Link class="text-sm" href="/">Back to home</Link>
		</header>

		<div class="mt-8">
			{#each releases as release (release.version)}
				<article class="border-b border-border py-6 first:pt-0 last:border-b-0 last:pb-0">
					<div class="grid gap-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
						<div class="space-y-1">
							<h2 class="text-lg font-semibold text-foreground">{release.version}</h2>
							<p class="text-sm text-muted-foreground">{release.date}</p>
						</div>

						<div class="space-y-4">
							{#each release.notes as note (`${release.version}-${note.type}`)}
								<section class="space-y-1.5">
									<p
										class={`text-[0.68rem] font-semibold tracking-[0.12em] uppercase ${noteLabelClasses[note.type]}`}
									>
										{note.type}
									</p>
									<ul class="space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
										{#each note.items as item (`${release.version}-${note.type}-${item}`)}
											<li>{item}</li>
										{/each}
									</ul>
								</section>
							{/each}
						</div>
					</div>
				</article>
			{/each}
		</div>
	</div>
</main>
