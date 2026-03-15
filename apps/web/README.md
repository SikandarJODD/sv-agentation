# Svelte Agentation Website

![Svelte Agentation OG](https://sv-agentation.com/og.png)

[![npm version](https://img.shields.io/npm/v/sv-agentation)](https://www.npmjs.com/package/sv-agentation)
[![downloads](https://img.shields.io/npm/dm/sv-agentation)](https://www.npmjs.com/package/sv-agentation)

Marketing site, docs, and playground app for `sv-agentation`.

## Overview

`sv-agentation` is a dev-mode Svelte inspector for source-aware element inspection and browser annotations. This app is the public landing page and docs surface for the package.

## Installation

```sh
npm install sv-agentation
```

```sh
pnpm add sv-agentation
```

```sh
yarn add sv-agentation
```

```sh
bun add sv-agentation
```

## Usage

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

## Features

1. Inspect DOM elements and resolve source file location.
2. Annotate individual elements directly in the page.
3. Annotate selected text ranges.
4. Annotate grouped selections across multiple elements.
5. Annotate selected page areas.
6. Use a draggable floating toolbar.
7. Choose toolbar position presets.
8. Toggle the inspector theme inside the tool UI.
9. Toggle marker visibility for notes.
10. Block normal page interactions while inspecting.
11. Use a delete-all flow with configurable delay.
12. Copy structured annotation output for developer and AI-assisted workflows.
13. Mount the inspector only in dev mode with `browser && dev`.

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `workspaceRoot` | `string \| null` | Absolute project root for source lookup and editor links. |
| `selector` | `string \| null` | Optional selector to scope inspectable elements. |
| `vscodeScheme` | `'vscode' \| 'vscode-insiders'` | Choose the VS Code URL scheme for open-in-editor actions. |
| `openSourceOnClick` | `boolean` | Open source directly on click instead of only showing metadata. |
| `deleteAllDelayMs` | `number` | Confirmation delay for delete-all notes. |
| `toolbarPosition` | `'top-left' \| 'top-center' \| 'top-right' \| 'mid-right' \| 'mid-left' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right'` | Initial preset for the floating toolbar position. |

## Shortcuts

| Shortcut | Action | Description |
| --- | --- | --- |
| `i` | Toggle inspector | Open or close the inspector toolbar and annotation mode. |
| `c` | Copy all notes | Copy notes as Markdown when at least one note exists. |
| `r` | Reset toolbar position | Move the floating toolbar back to its default bottom-right placement. |
| `o` | Open source | Open the currently hovered source location when the inspector is active. |
| `esc` | Cancel current action | Clear transient selections, close the composer, or close settings/delete state. |
| `shift + ctrl/cmd + click` | Build a group selection | Add or remove elements from a grouped annotation target before releasing the modifiers. |

## Local Dev

```sh
pnpm --filter @sv-agentation/web dev
```

## Build

```sh
pnpm --filter @sv-agentation/web build
```

## Notes

- Highly inspired from Agentation.
- This app depends on the local workspace package `sv-agentation`.
- `llms.txt` is available from the website for machine-readable package/docs context.
