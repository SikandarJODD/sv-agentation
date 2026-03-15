# Agentation Plan

Last updated: March 15, 2026

## Goal

Keep `sv-agentation` focused on a simple dev-mode workflow:

- inspect the page in browser
- add notes to elements, text, grouped elements, or dragged areas
- copy notes into AI
- update the UI fast without cloud sync or collaboration

## Status

- Phase 0: Source inspector baseline - Completed
- Phase 1: Element notes + toolbar UX - Completed
- Phase 2: Text, group, and area notes - Completed
- Phase 3: Hardening + export detail + restore edge cases - Next
- Phase 4: Production readiness + automated coverage - Pending

## Completed

- Dev-only inspector mount
- Element, text, group, and area notes
- Draggable toolbar with collapsed and expanded states
- Global toolbar position persistence
- 8 toolbar presets with settings UI
- `R` shortcut to reset toolbar to bottom-right
- Compact toolbar settings with auto flip above/below
- Marker color setting applied across note and selection visuals
- Theme toggle in toolbar settings
- Hide/show note markers with fade
- Delayed delete-all countdown with cancel
- Copy notes as Markdown
- Hover badge with `Open (O)` action
- Local browser storage for notes and settings

## Current Product Shape

- Notes stay local in browser storage
- Toolbar placement is stored globally
- Notes are stored per page
- Inspector is intended for dev mode, not production rollout yet

## Phase 3 Focus

- Stronger restore behavior when text/content changes after refresh
- Better unresolved-note recovery UX
- Better export detail beyond the current standard output
- More browser testing for drag, text, and grouped selection flows
- Better hit-testing so large containers do not feel too greedy

## Deferred On Purpose

- Cloud sync
- Collaboration
- Shared workspaces
- Package publishing
- Production mounting strategy

## Validation

- Keep roadmap aligned with `src/lib/copy-open`
- Use manual browser verification for interaction changes
- Keep using `pnpm check` and `pnpm build`
