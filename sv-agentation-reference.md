# sv-agentation Reference

Short reference for the current dev-mode inspector in `packages/sv-agentation/src/lib`.

## What It Does

- inspect elements in browser
- add element notes
- add selected-text notes
- add grouped-element notes
- add dragged-area notes
- reopen and edit saved notes
- copy all notes as Markdown
- open hovered source in VS Code
- move the toolbar, save its position, and reset it quickly

## Note Creation

- Element note: click an element while inspect mode is on
- Text note: select text, then release
- Group note: `Ctrl/Cmd + Shift + Click` multiple elements, then release modifier
- Area note: drag over an empty area

## Shortcuts

- `I`: toggle inspect mode
- `C`: copy notes as Markdown
- `O`: open hovered source in VS Code
- `R`: reset toolbar to bottom-right
- `Esc`: close composer, close settings, or clear active selection preview

Notes:

- `O` works when inspect mode is active and the composer is not open
- shortcuts ignore typing contexts like inputs and textareas

## Install

```sh
npm install sv-agentation
pnpm add sv-agentation
yarn add sv-agentation
bun add sv-agentation
```

## Toolbar Settings

- Output detail: currently `Standard`
- Marker color
- Toolbar position
- Theme mode: dark / light
- Block page interactions

## Toolbar Positions

- `top-left`
- `top-center`
- `top-right`
- `mid-left`
- `mid-right`
- `bottom-left`
- `bottom-center`
- `bottom-right`

Default: `bottom-right`

Behavior:

- preset selection snaps the toolbar to that anchor
- dragging switches toolbar placement to custom
- refresh restores the last saved placement
- `R` resets and saves `bottom-right`

## Public Props

```svelte
<Agentation
	workspaceRoot="/your/project/root"
	selector="[data-demo-scope]"
	vscodeScheme="vscode"
	openSourceOnClick={true}
	deleteAllDelayMs={3000}
	toolbarPosition="bottom-right"
/>
```

Primary export: `Agentation`

Compatibility aliases: `AgentationInspector`, `ElementSourceInspector`

`Agentation` props:

- `workspaceRoot?: string | null`
  - workspace root used for source path cleanup
- `selector?: string | null`
  - limits inspection to a specific DOM scope
- `vscodeScheme?: 'vscode' | 'vscode-insiders'`
  - default: `vscode`
- `openSourceOnClick?: boolean`
  - default: `true`
- `deleteAllDelayMs?: number`
  - default: `3000`
  - invalid values fall back to `3000`
- `toolbarPosition?: InspectorPosition`
  - default: `bottom-right`
  - acts as the initial preset, not a hard lock

## Storage

- notes: per page in local storage
- toolbar placement: global local storage
- theme mode: local storage
- marker color: local storage
- legacy `copy-open:*` storage keys still restore existing browser data

## Current Scope

- built for local dev workflow
- no cloud sync
- no collaboration
- packaged from `packages/sv-agentation`
- production mounting strategy
