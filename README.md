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

	// for open in vs code feature
	const workspaceRoot = '/absolute/path/to/your/repo';
</script>

{#if browser && dev}
	<Agentation {workspaceRoot} />
{/if}
```

Mount the inspector only in development and only in the browser.

## Architecture

```text
Agentation
  -> element-source-inspector.svelte
  -> CopyOpenController
      -> internal/controller-state.svelte.ts
      -> internal/controller-selection.ts
      -> internal/controller-composer.ts
      -> internal/controller-browser.ts
  -> components/*
  -> utils/note-*.ts + utils/selection.ts + utils/source.ts
```

## Interaction Flow

```text
inspect / select
  -> open composer
  -> save note
  -> persist to localStorage
  -> render markers
```

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
10. Copy notes in `compact`, `standard`, `detailed`, or `forensic` output modes.
11. Capture stable page metadata, selector paths, bounding boxes, nearby text, and component context for copied output.
12. Include computed-style snapshots for forensic exports.
13. Pause page animations while inspecting when needed.
14. Toggle marker visibility for notes.
15. Block normal page interactions while inspecting.
16. Use a delete-all flow with configurable delay.
17. Hook into annotation lifecycle and copy events with callbacks.
18. Mount the inspector only in dev mode with `browser && dev`.

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `workspaceRoot` | `string \| null` | Absolute project root for source lookup and editor links. |
| `selector` | `string \| null` | Optional selector to scope inspectable elements. |
| `vscodeScheme` | `'vscode' \| 'vscode-insiders'` | Choose the VS Code URL scheme for open-in-editor actions. |
| `openSourceOnClick` | `boolean` | Open source directly on click instead of only showing metadata. |
| `deleteAllDelayMs` | `number` | Confirmation delay for delete-all notes. |
| `toolbarPosition` | `'top-left' \| 'top-center' \| 'top-right' \| 'mid-right' \| 'mid-left' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right'` | Initial preset for the floating toolbar position. |
| `outputMode` | `'compact' \| 'standard' \| 'detailed' \| 'forensic'` | Initial copy/export mode for note output. |
| `pauseAnimations` | `boolean` | Start with page animations paused while the inspector is active. |
| `clearOnCopy` | `boolean` | Clear saved notes after a successful copy action. |
| `includeComponentContext` | `boolean` | Include captured component ancestry in copied output. |
| `includeComputedStyles` | `boolean` | Include computed styles in forensic output payloads. |
| `copyToClipboard` | `boolean` | Disable direct clipboard writes and use callbacks only. |
| `onAnnotationAdd` | `(annotation) => void` | Called after a note is created. |
| `onAnnotationUpdate` | `(annotation) => void` | Called after a note is updated. |
| `onAnnotationDelete` | `(annotation) => void` | Called after a note is deleted. |
| `onAnnotationsClear` | `(annotations) => void` | Called after all notes are cleared. |
| `onCopy` | `(markdown, payload) => void` | Called after note export is prepared. |

## Shortcuts

| Shortcut | Action | Description |
| --- | --- | --- |
| `i` | Toggle inspector | Open or close the inspector toolbar and annotation mode. |
| `c` | Copy all notes | Copy notes as Markdown when at least one note exists. |
| `r` | Reset toolbar position | Move the floating toolbar back to its default bottom-right placement. |
| `o` | Open source | Open the currently hovered source location when the inspector is active. |
| `esc` | Cancel current action | Clear transient selections, close the composer, or close settings/delete state. |
| `shift + ctrl/cmd + click` | Build a group selection | Add or remove elements from a grouped annotation target before releasing the modifiers. |

## Notes

- Targets Svelte 5 consumers.
- Intended for browser/dev-mode use, not production collaboration flows.
- Highly inspired from Agentation.
- Source-opening depends on `element-source` metadata and your `workspaceRoot` plus editor setup.

## Credits

This project is highly inspired by [Agentation.com](https://www.agentation.com).

## Sponsor

[![GitHub Sponsors](https://img.shields.io/badge/GitHub%20Sponsors-Support-pink?logo=githubsponsors)](https://github.com/sponsors/SikandarJODD)
