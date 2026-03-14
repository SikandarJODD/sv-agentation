<script lang="ts">
	import { backOut, cubicInOut } from 'svelte/easing';
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

{#if visible}
	{#each notes as note, index (note.id)}
		{#if note.position}
			<button
				aria-label={`Open note ${index + 1}`}
				class:active-marker={activeNoteId === note.id}
				class:group-marker={note.kind === 'group' || note.kind === 'area'}
				class:unresolved-marker={note.resolution === 'unresolved'}
				class="marker"
				data-inspector-ui
				style={`left:${note.position.markerLeft}px;top:${note.position.markerTop}px;`}
				type="button"
				onclick={(event) => handleOpenNote(event, note.id)}
				onmouseenter={() => setHoveredNote(note.id)}
				onmouseleave={() => setHoveredNote(null)}
				onfocus={() => setHoveredNote(note.id)}
				onblur={() => setHoveredNote(null)}
				in:scale={markerEnter}
				out:scale={markerExit}
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
			transform 180ms ease,
			box-shadow 180ms ease,
			filter 180ms ease;
	}

	.marker.group-marker {
		background: var(--inspector-group-color);
	}

	.marker:hover {
		transform: translate(-50%, calc(-50% - 1px));
		box-shadow: var(--inspector-shadow-overlay);
	}

	.marker.active-marker {
		filter: saturate(1.14);
		box-shadow: var(--inspector-shadow-overlay);
	}

	.marker.unresolved-marker {
		opacity: 0.78;
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
