<script lang="ts">
	import { backOut, cubicInOut } from 'svelte/easing';
	import { fade, scale } from 'svelte/transition';
	import { PenLine } from '@lucide/svelte';

	import type { NoteMarkersProps } from '../internal/component-props';

	let { activeNoteId, composerNoteId, notes, visible, onOpenNote }: NoteMarkersProps = $props();

	let hoveredNoteId = $state<string | null>(null);

	$effect(() => {
		if (!visible) {
			hoveredNoteId = null;
		}
	});

	const handleOpenNote = async (event: MouseEvent, noteId: string) => {
		event.preventDefault();
		event.stopPropagation();
		await onOpenNote(noteId);
	};

	const setHoveredNote = (noteId: string | null) => {
		if (composerNoteId !== null && noteId !== null) {
			return;
		}

		hoveredNoteId = noteId;
	};

	const showEditIcon = (noteId: string) =>
		composerNoteId === noteId || (composerNoteId === null && hoveredNoteId === noteId);
	const showHoverPreview = (noteId: string) =>
		visible && composerNoteId === null && hoveredNoteId === noteId;
	const getHoverOutlineClass = (note: NoteMarkersProps['notes'][number]) =>
		note.kind === 'group' || note.kind === 'area' ? 'hover-outline dashed' : 'hover-outline solid';

	const getPreviewStyle = (note: NoteMarkersProps['notes'][number]) => {
		if (!note.position || typeof window === 'undefined') {
			return 'left:12px;top:12px;';
		}

		const previewWidth = 236;
		const left = Math.min(
			Math.max(12, note.position.markerLeft - previewWidth * 0.58),
			window.innerWidth - previewWidth - 12
		);
		const top = Math.max(12, note.position.markerTop - 88);

		return `left:${left}px;top:${top}px;`;
	};

	const markerEnter = {
		duration: 180,
		start: 0.72,
		opacity: 0,
		easing: backOut
	};

	const markerExit = {
		duration: 140,
		start: 1,
		opacity: 0,
		easing: cubicInOut
	};
</script>

{#each notes as note, index (note.id)}
	{#if note.position?.visibleInViewport}
		<button
			aria-hidden={!visible}
			aria-label={`Open note ${index + 1}`}
			class:active-marker={activeNoteId === note.id}
			class:group-marker={note.kind === 'group' || note.kind === 'area'}
			class:hovered-marker={hoveredNoteId === note.id}
			class:marker-hidden={!visible}
			class:unresolved-marker={note.resolution === 'unresolved'}
			class="marker"
			data-inspector-ui
			disabled={!visible}
			style={`left:${note.position.markerLeft}px;top:${note.position.markerTop}px;`}
			type="button"
			onclick={(event) => handleOpenNote(event, note.id)}
			onmouseenter={() => setHoveredNote(note.id)}
			onmouseleave={() => setHoveredNote(null)}
			onfocus={() => setHoveredNote(note.id)}
			onblur={() => setHoveredNote(null)}
			in:scale|global={markerEnter}
			out:scale|global={markerExit}
		>
			<span class="marker-content" data-inspector-ui>
				{#key `${note.id}:${showEditIcon(note.id) ? 'edit' : 'count'}`}
					<span
						class="marker-value"
						data-inspector-ui
						in:scale|global={{ duration: 200, start: 0.80 }}
					>
						{#if showEditIcon(note.id)}
							<PenLine size={11} />
						{:else}
							<span>{index + 1}</span>
						{/if}
					</span>
				{/key}
			</span>
		</button>

		{#if showHoverPreview(note.id)}
			{#each note.position.outlineRects as rect, outlineIndex (`hover-outline-${note.id}-${outlineIndex}`)}
				<div
					aria-hidden="true"
					class={getHoverOutlineClass(note)}
					data-inspector-ui
					style={`left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;`}
					in:fade={{ duration: 120 }}
					out:fade={{ duration: 90 }}
				></div>
			{/each}

			{#each note.position.highlightRects as rect, highlightIndex (`hover-highlight-${note.id}-${highlightIndex}`)}
				<div
					aria-hidden="true"
					class="hover-highlight-rect"
					data-inspector-ui
					style={`left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;`}
					in:fade={{ duration: 120 }}
					out:fade={{ duration: 90 }}
				></div>
			{/each}

			<div
				class="note-preview"
				data-inspector-ui
				style={getPreviewStyle(note)}
				in:scale={{ duration: 150, start: 0.96 }}
				out:fade={{ duration: 120 }}
			>
				<div class="note-preview-title" data-inspector-ui>{note.targetSummary}</div>
				<div class="note-preview-body" data-inspector-ui>{note.note}</div>
			</div>
		{/if}
	{/if}
{/each}

<style>
	.marker {
		position: fixed;
		z-index: 9997;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		padding: 0;
		border: 1.5px solid var(--inspector-marker-border);
		border-radius: 999px;
		background: var(--inspector-marker-color);
		color: #ffffff;
		font: inherit;
		font-size: 0.68rem;
		font-weight: 700;
		box-shadow: var(--inspector-shadow-marker);
		transform: translate(-50%, -50%);
		cursor: pointer;
		will-change: transform, opacity;
		transition:
			opacity 180ms ease,
			transform 180ms ease,
			box-shadow 180ms ease,
			filter 180ms ease;
	}

	.marker-content,
	.marker-value {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.marker-content {
		transition:
			opacity 160ms ease,
			transform 160ms ease;
	}

	.marker.group-marker {
		background: var(--inspector-group-color);
	}

	.marker.marker-hidden {
		opacity: 0;
		pointer-events: none;
		transform: translate(-50%, -50%) scale(0.9);
	}

	.marker.marker-hidden .marker-content {
		opacity: 0;
		transform: scale(0.78);
	}

	.marker.active-marker {
		filter: saturate(1.14);
		box-shadow: var(--inspector-shadow-overlay);
	}

	.marker.hovered-marker,
	.marker:focus-visible {
		transform: translate(-50%, -50%) scale(1.06);
		box-shadow: var(--inspector-shadow-overlay);
	}

	.marker.unresolved-marker {
		opacity: 0.78;
	}

	.marker.marker-hidden.unresolved-marker {
		opacity: 0;
	}

	.note-preview {
		position: fixed;
		z-index: 9998;
		width: min(236px, calc(100vw - 24px));
		padding: 9px 12px 10px;
		border: 1px solid var(--inspector-border);
		border-radius: 16px;
		background: var(--inspector-overlay-surface);
		color: var(--inspector-text-primary);
		box-shadow: var(--inspector-shadow-overlay);
		backdrop-filter: blur(16px);
		pointer-events: none;
	}

	.hover-outline,
	.hover-highlight-rect {
		position: fixed;
		z-index: 9996;
		box-sizing: border-box;
		pointer-events: none;
	}

	.hover-outline.solid {
		border: 1.5px solid var(--inspector-outline-border);
		border-radius: 4px;
		background: var(--inspector-outline-bg);
		box-shadow: 0 0 0 1px var(--inspector-outline-inner) inset;
	}

	.hover-outline.dashed {
		border: 2px dashed var(--inspector-group-outline-border);
		border-radius: 4px;
		background: var(--inspector-group-outline-bg);
	}

	.hover-highlight-rect {
		border-radius: 3px;
		background: color-mix(in srgb, var(--inspector-marker-color) 18%, transparent);
	}

	.note-preview-title {
		margin-bottom: 4px;
		overflow: hidden;
		color: var(--inspector-text-muted);
		font-size: 0.79rem;
		font-style: italic;
		font-weight: 600;
		line-height: 1.2;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.note-preview-body {
		font-size: 0.78rem;
		line-height: 1.28;
		color: var(--inspector-text-primary);
	}
</style>
