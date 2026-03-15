# sv-agentation

`sv-agentation` is a dev-mode Svelte inspector for source-aware element inspection and browser annotations. It is designed to help developers inspect rendered DOM, jump to source in VS Code, annotate UI directly in the browser, and copy structured output for developer or AI-assisted workflows.

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

## Public Props

### `workspaceRoot?: string | null`

Absolute path to the project root. This allows the inspector to build editor links and resolve source file paths correctly.

### `selector?: string | null`

Optional CSS selector used to scope which elements the inspector should consider.

### `vscodeScheme?: 'vscode' | 'vscode-insiders'`

Controls which VS Code URL scheme is used when opening source directly from the inspector.

### `openSourceOnClick?: boolean`

When enabled, clicking a detected target can open its source location directly instead of only showing metadata.

### `deleteAllDelayMs?: number`

Configures the confirmation delay used by the delete-all notes flow.

### `toolbarPosition?: 'top-left' | 'top-center' | 'top-right' | 'mid-right' | 'mid-left' | 'bottom-left' | 'bottom-center' | 'bottom-right'`

Sets the initial toolbar position preset for the floating inspector controls.

## Supported Features

- Inspect DOM elements and resolve source file location.
- Jump to source with VS Code or VS Code Insiders URL schemes.
- Annotate individual elements directly in the page.
- Annotate selected text ranges.
- Annotate grouped selections across multiple elements.
- Annotate selected page areas.
- Use a draggable floating toolbar.
- Choose toolbar position presets.
- Toggle the inspector theme inside the tool UI.
- Toggle marker visibility for notes.
- Block normal page interactions while inspecting.
- Use a delete-all flow with configurable delay.
- Copy structured annotation output for developer and AI-assisted workflows.
- Mount the inspector only in dev mode with `browser && dev`.

## Current Limitations

- The package is focused on Svelte apps and Svelte dev workflows.
- The documented public props are limited to the current `InspectorProps` interface.
- The project does not currently document MCP integrations, webhooks, or external sync APIs.
