# Agentation Plan

Last updated: March 15, 2026

## Goal

Build an Agentation-inspired annotation workflow on top of the existing Svelte element inspector so a user can inspect UI, attach notes to exact UI points, review those notes later, and eventually annotate selected text with reliable restore behavior.

This file is the single project roadmap for what is done, what is next, and what is intentionally deferred.

## Current Status Snapshot

Phase labels describe feature milestones, not strict commit order.

- Phase 0: Source Inspector Baseline - Completed
- Phase 1: Element Notes + Toolbar UX - Completed
- Phase 2: Selected Content Notes - Next
- Phase 3: Hardening, Export Detail, Restore Edge Cases - Pending
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

## Next Focus

Phase 2 should stay narrow and practical.

- Add selected-text note creation
- Persist text-range anchors
- Restore text highlights after refresh
- Anchor the composer near the selection end point
- Handle unresolved selections safely instead of dropping notes

## Later Phases

- Detailed export mode beyond the current standard output
- Better restore fallback and unresolved-note UX
- Settings completion beyond the current trimmed shell
- Production mount strategy beyond the current dev-only gate
- Automated tests for toolbar, notes, persistence, and selection restore

## Known Gaps / Constraints

- Notes are local-only right now
- Selection notes are not implemented yet
- Toolbar and settings are partially feature-complete, not final
- Current validation is manual plus `pnpm check` and `pnpm build`

## Current Interfaces

Important exported note-related types in [src/lib/copy-open/types.ts](src/lib/copy-open/types.ts):

- `InspectorNote`
- `ElementNoteAnchor`
- `ToolbarState`
- `NoteComposerState`
- `NotesSettings`
- `RenderedInspectorNote`

## Validation

- Confirm the roadmap still matches the actual behavior in `src/lib/copy-open`
- Move items from `Next` to `Completed` only after browser verification
- Update phase status labels after each milestone
