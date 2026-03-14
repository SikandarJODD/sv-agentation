<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { PenLine } from '@lucide/svelte';

	import type { RenderedInspectorNote } from '../types';

	let {
		activeNoteId,
		notes,
		visible,
		onOpenNote
	}: {
		activeNoteId: string | null;
		notes: RenderedInspectorNote[];
		visible: boolean;
		onOpenNote: (noteId: string) => Promise<boolean>;
	} = $props();

	let hoveredNoteId = $state<string | null>(null);

	const handleOpenNote = async (event: MouseEvent, noteId: string) => {
		event.preventDefault();
		event.stopPropagation();
		await onOpenNote(noteId);
	};

	const setHoveredNote = (noteId: string | null) => {
		hoveredNoteId = noteId;
	};

	const getPreviewStyle = (note: RenderedInspectorNote) => {
		if (!note.position || typeof window === 'undefined') {
			return 'left:12px;top:12px;';
		}

		const previewWidth = 242;
		const left = Math.min(
			Math.max(12, note.position.markerLeft - previewWidth + 22),
			window.innerWidth - previewWidth - 12
		);
		const top = Math.max(12, note.position.markerTop - 82);

		return `left:${left}px;top:${top}px;`;
	};
</script>

{#if visible}
	{#each notes as note, index (note.id)}
		{#if note.position}
			<button
				aria-label={`Open note ${index + 1}`}
				class:active-marker={activeNoteId === note.id}
				class="marker"
				data-inspector-ui
				style={`left:${note.position.markerLeft}px;top:${note.position.markerTop}px;--marker-color:${note.color};`}
				title={note.note}
				type="button"
				onclick={(event) => handleOpenNote(event, note.id)}
				onmouseenter={() => setHoveredNote(note.id)}
				onmouseleave={() => setHoveredNote(null)}
				onfocus={() => setHoveredNote(note.id)}
				onblur={() => setHoveredNote(null)}
				in:scale={{ duration: 160, start: 0.86 }}
				out:fade={{ duration: 130 }}
			>
				{#if hoveredNoteId === note.id || activeNoteId === note.id}
					<PenLine size={11} />
				{:else}
					<span>{index + 1}</span>
				{/if}
			</button>

			{#if hoveredNoteId === note.id}
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
{/if}

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
		border: 1.5px solid rgba(255, 255, 255, 0.92);
		border-radius: 999px;
		background: var(--marker-color);
		color: #ffffff;
		font: inherit;
		font-size: 0.68rem;
		font-weight: 700;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
		transform: translate(-50%, -50%);
		cursor: pointer;
		transition:
			transform 180ms ease,
			box-shadow 180ms ease,
			filter 180ms ease;
	}

	.marker:hover {
		transform: translate(-50%, calc(-50% - 1px));
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
	}

	.marker.active-marker {
		filter: saturate(1.14);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
	}

	.note-preview {
		position: fixed;
		z-index: 9998;
		width: min(242px, calc(100vw - 24px));
		padding: 8px 10px 10px;
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 18px;
		background: rgba(28, 28, 30, 0.98);
		color: rgba(255, 255, 255, 0.92);
		box-shadow: 0 12px 22px rgba(0, 0, 0, 0.14);
		backdrop-filter: blur(16px);
		pointer-events: none;
	}

	.note-preview-title {
		margin-bottom: 5px;
		overflow: hidden;
		color: rgba(255, 255, 255, 0.56);
		font-size: 0.8rem;
		font-style: italic;
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.note-preview-body {
		font-size: 0.76rem;
		line-height: 1.32;
		color: rgba(255, 255, 255, 0.95);
	}
</style>
