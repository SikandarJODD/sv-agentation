# sv-agentation

![Svelte Agentation OG](https://sv-agentation.com/og.png)

[![npm version](https://img.shields.io/npm/v/sv-agentation)](https://www.npmjs.com/package/sv-agentation)
[![downloads](https://img.shields.io/npm/dm/sv-agentation)](https://www.npmjs.com/package/sv-agentation)

**Live Preview:** [Svelte Agentation](https://sv-agentation.com)

Dev-mode Svelte inspector for source-aware element inspection and browser annotations.

## Overview

`sv-agentation` helps developers inspect rendered DOM, jump to source, annotate UI directly in the browser, and copy structured output for developer or AI-assisted workflows.

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

Mount the inspector only in development and only in the browser.

## Features

1. Inspect DOM elements and resolve source file location.
2. Jump to source with VS Code or VS Code Insiders URL schemes.
3. Annotate individual elements directly in the page.
4. Annotate selected text ranges.
5. Annotate grouped selections across multiple elements.
6. Annotate selected page areas.
7. Use a draggable floating toolbar.
8. Choose toolbar position presets.
9. Toggle the inspector theme inside the tool UI.
10. Toggle marker visibility for notes.
11. Block normal page interactions while inspecting.
12. Use a delete-all flow with configurable delay.
13. Copy structured annotation output for developer and AI-assisted workflows.
14. Mount the inspector only in dev mode with `browser && dev`.

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

## Public API

- `Agentation`
- `AgentationInspector`
- `ElementSourceInspector`
- `AGENTATION_ACTIVE_CHANGE_EVENT`
- `AGENTATION_BLOCKED_INTERACTION_EVENT`
- `COPY_OPEN_ACTIVE_CHANGE_EVENT`
- `COPY_OPEN_BLOCKED_INTERACTION_EVENT`
- `INSPECTOR_ACTIVE_CHANGE_EVENT`
- `INSPECTOR_BLOCKED_INTERACTION_EVENT`
- `AgentationProps`
- `InspectorProps`
- related exported `Inspector*` public types

## Notes

- Targets Svelte 5 consumers.
- Intended for browser/dev-mode use, not production collaboration flows.
- Highly inspired from Agentation.
- Source-opening depends on `element-source` metadata and your `workspaceRoot` plus editor setup.

## Credits

This project is highly inspired by [Agentation.com](https://www.agentation.com).

## Sponsor

[![GitHub Sponsors](https://img.shields.io/badge/GitHub%20Sponsors-Support-pink?logo=githubsponsors)](https://github.com/sponsors/SikandarJODD)
