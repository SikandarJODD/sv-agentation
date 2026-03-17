<script lang="ts">
	import GithubIcon from '@lucide/svelte/icons/github';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import SunIcon from '@lucide/svelte/icons/sun';
	import { mode, toggleMode } from 'mode-watcher';
	import { MetaTags, type MetaTagsProps } from 'svelte-meta-tags';
	import {
		Divider,
		H1,
		H2,
		Link,
		ListItem,
		OrderedList,
		Paragraph,
		Strong,
		Table,
		Tbody,
		Td,
		Th,
		Thead,
		Tr
	} from '$lib/components/markdown';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button/index';
	import * as Code from '$lib/components/ui/code';
	import { CopyButton } from '$lib/components/ui/copy-button';
	import { Kbd } from '$lib/components/ui/kbd';
	import PMCommand from '$lib/components/ui/pm-command/pm-command.svelte';
	import { asset } from '$app/paths';
	import { page } from '$app/state';

	let npmjsUrl = 'https://www.npmjs.com/package/sv-agentation';
	let siteUrl = 'https://sv-agentation.com';
	const githubUrl = 'https://github.com/SikandarJODD/sv-agentation';
	const npmxUrl = 'https://npmx.dev/package/sv-agentation';
	let llmsUrl = 'https://sv-agentation.com/llms.txt';

	let metaTags: MetaTagsProps = {
		title: 'Svelte Agentation',
		description:
			'Minimal source-inspection tooling for Svelte apps, inspired by Agentation and designed for dev-only workflows.',
		canonical: siteUrl,
		openGraph: {
			type: 'website',
			url: siteUrl,
			title: 'Svelte Agentation',
			description:
				'Minimal source-inspection tooling for Svelte apps, inspired by Agentation and designed for dev-only workflows.',
			siteName: 'Svelte Agentation',
			images: [
				{
					url: `${siteUrl}/og.png`,
					width: 1200,
					height: 630,
					alt: 'Svelte Agentation landing page preview'
				}
			]
		},
		twitter: {
			cardType: 'summary_large_image',
			title: 'Svelte Agentation',
			description:
				'Minimal source-inspection tooling for Svelte apps, inspired by Agentation and designed for dev-only workflows.',
			image: `${siteUrl}/og.png`
		}
	};

	const usageSnippet = `<script lang="ts">
  import { browser, dev } from '$app/environment';
  import { Agentation } from 'sv-agentation';

  //  provide the absolute path to your project
  //  to open directly in vs code
  const workspaceRoot = '/absolute/path/to/your/repo';
<\/script>

{#if browser && dev}
  <Agentation {workspaceRoot} />
{/if}`;

	const installationPrompt = `Install sv-agentation in this SvelteKit project and wire it into the app shell.

1. Add the package with the current package manager:
   pnpm add sv-agentation

2. Update src/routes/+layout.svelte to mount Agentation only in development and only in the browser.

Use this example:

<script lang="ts">
  import './layout.css';
  import { browser, dev } from '$app/environment';
  import { Agentation } from 'sv-agentation';

  let { children } = $props();
  const workspaceRoot = '/absolute/path/to/your/repo';
<\/script>

{@render children()}

{#if browser && dev}
  <Agentation {workspaceRoot} />
{/if}

3. Keep it disabled in production.
4. If needed, set workspaceRoot to the absolute path of the repo so source links open correctly.`;

	const features = [
		'Inspect <strong>DOM elements</strong> and resolve source file location.',
		// 'Jump to source with <strong>VS Code</strong> or <strong>VS Code Insiders</strong> URL schemes.',
		'Annotate <strong>individual elements</strong> directly in the page.',
		'Annotate <strong>selected text ranges</strong>.',
		'Annotate <strong>grouped selections</strong> across multiple elements.',
		'Annotate <strong>selected page areas</strong>.',
		'Use a <strong>draggable floating toolbar</strong>.',
		'Choose <strong>toolbar position presets</strong>.',
		'Toggle the <strong>inspector theme</strong> inside the tool UI.',
		'Toggle <strong>marker visibility</strong> for notes.',
		'Block <strong>normal page interactions</strong> while inspecting.',
		'Use a <strong>delete-all flow</strong> with configurable delay.',
		'Copy <strong>structured annotation output</strong> for developer and AI-assisted workflows.',
		'Mount the inspector only in <strong>dev mode</strong> with <strong>`browser && dev`</strong>.'
	];

	const props = [
		{
			name: 'workspaceRoot',
			type: 'string | null',
			description: 'Absolute project root for source lookup and editor links.'
		},
		{
			name: 'selector',
			type: 'string | null',
			description: 'Optional selector to scope inspectable elements.'
		},
		{
			name: 'vscodeScheme',
			type: "'vscode' | 'vscode-insiders'",
			description: 'Choose the VS Code URL scheme for open-in-editor actions.'
		},
		{
			name: 'openSourceOnClick',
			type: 'boolean',
			description: 'Open source directly on click instead of only showing metadata.'
		},
		{
			name: 'deleteAllDelayMs',
			type: 'number',
			description: 'Confirmation delay for delete-all notes.'
		},
		{
			name: 'toolbarPosition',
			type: "'top-left' | 'top-center' | 'top-right' | 'mid-right' | 'mid-left' | 'bottom-left' | 'bottom-center' | 'bottom-right'",
			description: 'Initial preset for the floating toolbar position.'
		}
	];

	const shortcuts = [
		{
			key: 'i',
			label: 'Toggle inspector',
			description: 'Open or close the inspector toolbar and annotation mode.'
		},
		{
			key: 'c',
			label: 'Copy all notes',
			description: 'Copy notes as Markdown when at least one note exists.'
		},
		{
			key: 'r',
			label: 'Reset toolbar position',
			description: 'Move the floating toolbar back to its default bottom-right placement.'
		},
		{
			key: 'o',
			label: 'Open source',
			description: 'Open the currently hovered source location when the inspector is active.'
		},
		{
			key: 'esc',
			label: 'Cancel current action',
			description: 'Clear transient selections, close the composer, or close settings/delete state.'
		},
		{
			key: 'shift + ctrl/cmd + click',
			label: 'Build a group selection',
			description:
				'Add or remove elements from a grouped annotation target before releasing the modifiers.'
		}
	];
</script>

<MetaTags {...metaTags} />

<main class="min-h-screen bg-background px-5 py-10 text-foreground sm:px-6 sm:py-12">
	<div class="mx-auto flex w-full max-w-[42rem] flex-col">
		<header class="flex items-start justify-between gap-4">
			<div class="flex min-w-0 flex-col items-start">
				{#if mode.current === 'dark'}
					<img
						class="mt-1 size-9 shrink-0"
						src={asset('/main-favicon-light.svg')}
						alt="Svelte Agentation logo"
					/>
				{:else}
					<img
						class="mt-1 size-9 shrink-0"
						src={asset('/main-favicon.svg')}
						alt="Svelte Agentation logo"
					/>
				{/if}
				<div class="min-w-0">
					<div class="flex items-center gap-3">
						<H1 class="mt-0 text-[1.8rem] sm:text-[1.95rem]">Svelte Agentation</H1>
						<Badge variant="yellow" class="mt-1 rounded-md px-2 py-0.5 text-[0.7rem] uppercase">
							v0.1.0
						</Badge>
					</div>
					<Paragraph
						class="mt-3 max-w-[36rem] text-sm leading-6 text-muted-foreground sm:text-[0.95rem]"
					>
						Svelte Agentation turns UI annotations into structured context that AI coding agents can understand and act on.
						Click any element, add a note, and paste the output into Claude Code, Cursor, or any AI tool.
					</Paragraph>
				</div>
			</div>

			<Button
				variant="outline"
				size="icon-sm"
				class="mt-1 shrink-0 rounded-full border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
				aria-label={mode.current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
				onclick={() => toggleMode()}
			>
				{#if mode.current === 'dark'}
					<SunIcon class="size-4" />
				{:else}
					<MoonIcon class="size-4" />
				{/if}
			</Button>
		</header>

		<!-- <section
			aria-label="Preview"
			class="mt-9 overflow-hidden rounded-2xl border border-border bg-card/35"
		>
			<div class="flex items-center gap-3 border-b border-border px-4 py-3">
				<div class="flex gap-1.5">
					<span class="size-1.5 rounded-full bg-muted-foreground/30"></span>
					<span class="size-1.5 rounded-full bg-muted-foreground/30"></span>
					<span class="size-1.5 rounded-full bg-muted-foreground/30"></span>
				</div>
				<span class="font-mono text-[0.74rem] text-muted-foreground/70">localhost:5173</span>
			</div>

			<div class="px-4 py-7 sm:px-5 sm:py-8">
				<div class="relative grid max-w-[28rem] gap-3 px-2 py-2 sm:px-3">
					<p class="font-mono text-[0.72rem] text-muted-foreground">
						Hero - src/routes/+page.svelte:18
					</p>
					<h2
						class="text-[1.65rem] font-medium tracking-tight text-foreground italic sm:text-[1.8rem]"
					>
						Svelte Agentation
					</h2>
					<p class="max-w-[24rem] text-[0.93rem] leading-7 text-muted-foreground">
						Inspect any element, reveal its source, and stay inside your current dev flow.
					</p>
					<div
						class="pointer-events-none absolute top-[3rem] right-2 left-1 h-[4.25rem] border border-ring/50 bg-accent/40 sm:right-3 sm:left-3"
					></div>
					<button
						type="button"
						class="w-fit border border-border bg-secondary px-4 py-2 text-sm text-foreground"
					>
						Inspect source
					</button>
				</div>
			</div>
		</section> -->

		<div class="mt-7 flex flex-wrap items-center gap-3">
			<Button href={githubUrl} target="_blank" rel="noreferrer" variant="outline" class="text-xs">
				<svg viewBox="0 0 1024 1024" fill="none"
					><path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z"
						transform="scale(64)"
						fill="currentColor"
					/></svg
				>
				<span>Star on GitHub</span>
			</Button>

			<CopyButton text={installationPrompt} variant="secondary" class="rounded-md text-xs">
				Copy Prompt
			</CopyButton>
		</div>

		<Divider class="my-10" />

		<section aria-labelledby="installation-title" class="grid gap-3">
			<H2 id="installation-title" class="mt-0 text-[1.2rem]">Installation</H2>
			<PMCommand command="add" args={['sv-agentation']} />
			<div class="mt-0 rounded-md border border-border bg-card p-3">
				<p class="text-[0.82rem] tracking-[0.14em] text-muted-foreground uppercase">Try It</p>
				<p class="mt-2 text-sm leading-6 text-muted-foreground">
					The toolbar is active on this page. Press <Kbd class="mx-1">i</Kbd> to activate or deactivate
					it.
				</p>
			</div>
		</section>

		<Divider class="my-10" />

		<section aria-labelledby="usage-title" class="flex flex-col">
			<H2 id="usage-title" class="mt-0 text-[1.2rem]">Usage</H2>
			<Paragraph class="mt-3 mb-2 text-sm leading-6">
				Mount the component only in development and only in the browser.
			</Paragraph>
			<Code.Root
				code={usageSnippet}
				lang="svelte"
				class="mt-1 rounded-xl border-border bg-card/40 pr-12 text-sm [&_pre.shiki]:text-[0.82rem]"
			>
				<Code.CopyButton />
			</Code.Root>
		</section>

		<Divider class="my-10" />

		<section aria-labelledby="features-title" class="flex flex-col">
			<H2 id="features-title" class="text-[1.2rem]">Features</H2>
			<Paragraph class="mt-3 mb-1 text-sm leading-6">
				Everything listed here reflects the current supported surface of <Strong class="text-sm"
					>sv-agentation</Strong
				>.
			</Paragraph>
			<OrderedList class="mt-2 space-y-2 pl-5 text-sm leading-6">
				{#each features as feature}
					<ListItem>{@html feature}</ListItem>
				{/each}
			</OrderedList>
		</section>

		<Divider class="my-10" />

		<section aria-labelledby="props-title" class="flex flex-col">
			<H2 id="props-title" class="text-[1.2rem]">Props</H2>
			<Paragraph class="mt-3 mb-2 text-sm leading-6">
				The public component API is intentionally small, but it includes the core controls needed
				for editor opening, selection scoping, and toolbar behavior.
			</Paragraph>
			<Table class="mt-2 text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:h-10 [&_th]:px-4">
				<Thead>
					<Tr class="border-b border-border">
						<Th>Prop</Th>
						<Th>Type</Th>
						<Th>Description</Th>
					</Tr>
				</Thead>
				<Tbody>
					{#each props as prop}
						<Tr class="border-b border-border last:border-b-0">
							<Td><code>{prop.name}</code></Td>
							<Td><code>{prop.type}</code></Td>
							<Td>{prop.description}</Td>
						</Tr>
					{/each}
				</Tbody>
			</Table>
		</section>

		<Divider class="my-10" />

		<section aria-labelledby="shortcuts-title" class="flex flex-col">
			<H2 id="shortcuts-title" class="mt-0 text-[1.2rem]">Shortcuts</H2>
			<Paragraph class="mt-3 mb-2 text-sm leading-6">
				These are the keyboard shortcuts and selection gestures currently used by the inspector.
			</Paragraph>
			<Table class="mt-2 text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:h-10 [&_th]:px-4">
				<Thead>
					<Tr class="border-b border-border">
						<Th>Shortcut</Th>
						<Th>Action</Th>
						<Th>Description</Th>
					</Tr>
				</Thead>
				<Tbody>
					{#each shortcuts as shortcut}
						<Tr class="border-b border-border last:border-b-0">
							<Td>
								<div class="flex flex-wrap items-center gap-1.5">
									{#each shortcut.key.split(' + ') as keyPart}
										<Kbd>{keyPart}</Kbd>
									{/each}
								</div>
							</Td>
							<Td>{shortcut.label}</Td>
							<Td>{shortcut.description}</Td>
						</Tr>
					{/each}
				</Tbody>
			</Table>
		</section>

		<Divider class="my-10" />

		<footer class="mt-12 grid gap-3 pt-1">
			<H2 class="mt-0 text-[1.2rem]">Inspiration & Footer</H2>
			<p class="inline-flex items-center gap-2 text-[0.82rem] text-muted-foreground">
				<SparklesIcon class="size-3.5" />
				<span>Highly inspired from Agentation</span>
			</p>
			<div class="flex flex-wrap gap-4">
				<Link class="text-[0.86rem]" href={githubUrl}>GitHub</Link>
				<Link class="text-[0.86rem]" href={npmxUrl}>npmx</Link>
				<Link class="text-[0.86rem]" href={npmjsUrl}>npmjs</Link>
				<Link class="text-[0.86rem]" href={llmsUrl}>llms.txt</Link>
			</div>
			<p class="text-[0.82rem] leading-6 text-muted-foreground">
				Credits: this project is highly inspired by
				<Link class="text-[0.82rem]" href="https://www.agentation.com">Agentation.com</Link>.
			</p>
		</footer>
	</div>
</main>
