# Agentation Plan

Last updated: March 15, 2026

## Goal

Build an Agentation-inspired annotation workflow on top of the existing Svelte element inspector so a user can inspect UI, attach notes to exact UI points, review those notes later, and annotate selected text, grouped elements, or dragged areas with reliable restore behavior.

This file is the single project roadmap for what is done, what is next, and what is intentionally deferred.

## Current Status Snapshot

Phase labels describe feature milestones, not strict commit order.

- Phase 0: Source Inspector Baseline - Completed
- Phase 1: Element Notes + Toolbar UX - Completed
- Phase 2: Selected Content + Group Selection - Completed in code, browser polish ongoing
- Phase 3: Hardening, Export Detail, Restore Edge Cases - Next
- Phase 4: Production Readiness and Test Coverage - Pending

## Completed So Far

- Dev-only mounted inspector in [src/routes/+layout.svelte](src/routes/+layout.svelte)
- Draggable collapsed and expanded toolbar
- Element note add flow with anchored composer UI
- Element note edit flow
- Single-note delete flow
- Delete-all flow with confirmation
- Per-note marker rendering and hover preview
- Copy-all-notes action with temporary check feedback
- Local per-page persistence in browser storage
- Hover card reduced to `Open (O)` only
- Keyboard shortcuts currently active: `I`, `C`, `O`, `Esc`
- Typed note model now supports `element`, `text`, `group`, and `area`
- Legacy stored element notes are read back without wiping storage
- Selected-text note creation with text-range serialization
- Text highlight restore after refresh with unresolved fallback behavior
- Grouped selection via `Ctrl/Cmd + Shift + Click`
- Drag selection for grouped elements and empty-area notes
- Composer anchored near selection end / marker position for all note kinds
- Agentation-style cursor behavior:
  - crosshair by default
  - text cursor on text-like content
- Agentation-style selection colors:
  - marker color setting for element and text notes
  - fixed green accents for group and area notes
- Group note placeholder: `Feedback for this group of elements...`
- Normal placeholder: `What should change ?`
- Dashed drag-selection preview box and grouped-selection overlays
- Validation completed with `pnpm check` and `pnpm build`

## Next Focus

Phase 3 should focus on hardening what now exists instead of adding a new interaction mode.

- Improve restore fallback when selected text changes shape across refreshes
- Improve unresolved-note UX so unresolved notes are easier to identify and recover
- Expand markdown export beyond the current standard output
- Tighten drag-vs-text-selection heuristics with more browser validation
- Review multi-select hit-testing so large containers do not feel too greedy

## Remaining Priorities

These are ordered by practical importance, not just by roadmap phase.

### High Importance

- Hardening selection restore for real content changes
- Unresolved-note recovery UX
- Browser verification of drag, text selection, grouped selection, and reopen/edit flows

Why it matters:
- These directly affect trust. If notes do not restore cleanly or users cannot tell what broke, the feature feels unreliable even if the UI looks done.

### Medium Importance

- Better export / detailed output mode
- Finish trimmed settings behavior
- More precise drag-selection heuristics and overlap rules

Why it matters:
- These improve usability and output quality, but the current tool already works without them.

### Lower Importance

- Production mount strategy beyond the current dev-only gate
- Automated test coverage

Why it matters:
- Important before shipping broadly, but not required to keep iterating on the feature locally right now.

## Known Gaps / Constraints

- Notes are still local-only
- Inspector mount is still dev-only
- Phase 2 interaction flow is implemented, but still needs wider browser testing and tuning
- Toolbar and settings are functional but not final
- Validation is currently `pnpm check`, `pnpm build`, and manual browser verification

## Current Interfaces

Important exported note-related types in [src/lib/copy-open/types.ts](src/lib/copy-open/types.ts):

- `InspectorNote`
- `InspectorNoteKind`
- `ElementNoteAnchor`
- `TextSelectionAnchor`
- `GroupSelectionAnchor`
- `AreaSelectionAnchor`
- `ToolbarState`
- `NoteComposerState`
- `NotesSettings`
- `RenderedInspectorNote`

## Validation

- Keep the roadmap aligned with actual behavior in `src/lib/copy-open`
- Treat Phase 2 as feature-complete, but keep refining based on browser testing
- Move Phase 3 items to completed only after manual browser verification
- Add automated tests before calling Phase 4 production-ready
