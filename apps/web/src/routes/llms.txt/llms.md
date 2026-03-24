# sv-agentation

Svelte Agentation turns UI annotations into structured context that AI coding agents can understand and act on.
It is a dev-only Svelte inspector for source-aware inspection, page-scoped notes, and structured copy output.

## Installation

### npm

```bash
npm install sv-agentation
```

### pnpm

```bash
pnpm add sv-agentation
```

### bun

```bash
bun add sv-agentation
```

### yarn

```bash
yarn add sv-agentation
```

## Usage

Mount the inspector only in development and only in the browser.
Route-based note sessions are automatic by default.

```svelte
<script lang="ts">
	import { browser, dev } from '$app/environment';
	import { Agentation } from 'sv-agentation';

	const workspaceRoot = '/absolute/path/to/your/repo';
</script>

{#if browser && dev}
	<Agentation {workspaceRoot} />
{/if}
```

## Core Features

- Inspect source-aware DOM elements and jump to files quickly.
- Annotate elements, text ranges, grouped targets, and selected page areas.
- Keep notes isolated per page automatically as routes change.
- Copy notes in `compact`, `standard`, `detailed`, or `forensic` modes.
- Use a compact floating toolbar with output cycling and denser settings.
- Capture selector paths, bounds, nearby text, component context, and forensic computed styles.
- Hook into local annotation lifecycle and copy callbacks.
- Mount it only in development with `browser && dev`.

## Public Props

### Core

- `workspaceRoot?: string | null`
  Absolute project root for source lookup and editor links.
- `selector?: string | null`
  Optional selector to scope inspectable elements.
- `vscodeScheme?: 'vscode' | 'vscode-insiders'`
  Choose the VS Code URL scheme for open-in-editor actions.
- `openSourceOnClick?: boolean`
  Open source directly on click instead of only showing metadata.
- `deleteAllDelayMs?: number`
  Confirmation delay for delete-all notes.
- `toolbarPosition?: 'top-left' | 'top-center' | 'top-right' | 'mid-right' | 'mid-left' | 'bottom-left' | 'bottom-center' | 'bottom-right'`
  When provided, keeps the floating toolbar anchored to this preset and overrides saved toolbar placements.
- `pageSessionKey?: string | null`
  Optional advanced override for note session scoping. Most apps do not need this.

### Behavior

- `outputMode?: 'compact' | 'standard' | 'detailed' | 'forensic'`
  When provided, controls the copy mode and overrides saved toolbar settings.
- `pauseAnimations?: boolean`
  When provided, controls animation pausing and overrides saved toolbar settings.
- `clearOnCopy?: boolean`
  When provided, controls note clearing after copy and overrides saved toolbar settings.
- `includeComponentContext?: boolean`
  When provided, controls component-context capture and overrides saved toolbar settings.
- `includeComputedStyles?: boolean`
  When provided, controls computed-style capture and overrides saved toolbar settings.
- `copyToClipboard?: boolean`
  Lets you intercept copy output without writing to the clipboard.

### Callbacks

- `onAnnotationAdd?: (annotation: AgentationAnnotationSnapshot) => void`
  Fires when a new annotation is saved.
- `onAnnotationUpdate?: (annotation: AgentationAnnotationSnapshot) => void`
  Fires when an existing annotation is edited.
- `onAnnotationDelete?: (annotation: AgentationAnnotationSnapshot) => void`
  Fires when one annotation is removed.
- `onAnnotationsClear?: (annotations: AgentationAnnotationSnapshot[]) => void`
  Fires after the current page notes are cleared.
- `onCopy?: (markdown: string, payload: AgentationExportPayload) => void`
  Receives the generated markdown and structured export payload.

## Exported Types

- `AgentationProps`
- `OutputMode`
- `AgentationAnnotationSnapshot`
- `AgentationExportPayload`
- `ComputedStyleSnapshot`
- `ComponentContextMode`

## Example: Typed Callbacks

```svelte
<script lang="ts">
	import {
		Agentation,
		type AgentationAnnotationSnapshot,
		type AgentationExportPayload
	} from 'sv-agentation';

	const workspaceRoot = '/absolute/path/to/your/repo';

	const handleAnnotationAdd = (annotation: AgentationAnnotationSnapshot) => {
		console.log(annotation.targetLabel);
	};

	const handleCopy = (markdown: string, payload: AgentationExportPayload) => {
		console.log(markdown);
		console.log(payload.annotations.length);
	};
</script>

<Agentation
	{workspaceRoot}
	outputMode="detailed"
	copyToClipboard={false}
	onAnnotationAdd={handleAnnotationAdd}
	onCopy={handleCopy}
/>
```

## Shortcuts

- `i` toggles the inspector.
- `c` copies notes for the current page.
- `r` resets toolbar position.
- `o` opens the current source target.
- `esc` cancels the current action.
- `shift + ctrl/cmd + click` builds a grouped selection.
