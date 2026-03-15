# sv-agentation

Dev-mode Svelte inspector for annotating elements, text selections, grouped elements, and dragged areas directly in the browser.

## Install

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

`Agentation` is the primary export. `AgentationInspector` and `ElementSourceInspector` are kept as compatibility aliases during the initial `0.x` line.

## Public API

- `Agentation`
- `AgentationInspector`
- `ElementSourceInspector`
- `AGENTATION_ACTIVE_CHANGE_EVENT`
- `AGENTATION_BLOCKED_INTERACTION_EVENT`
- `Inspector*` public types

## Notes

- Targets Svelte 5 consumers.
- Intended for browser/dev-mode use, not production collaboration flows.
- Source-opening depends on `element-source` metadata and your `workspaceRoot`/editor setup.
