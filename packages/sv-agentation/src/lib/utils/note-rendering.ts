import type {
	AreaInspectorNote,
	InspectorNote,
	NoteComposerState,
	NoteResolutionState,
	RectBox,
	RenderedInspectorNote,
	ResolvedNotePosition,
	TextInspectorNote
} from '../types';
import { clampNumber, resolveDomPath } from './dom';
import { getComposerPosition } from './note-layout';
import type { NoteSourceInfo } from '../types';
import {
	markerFromFallback,
	resolveAreaSelection,
	resolveGroupSelection,
	resolveTextSelection
} from './selection';

const resolveElementNotePosition = (note: Extract<InspectorNote, { kind: 'element' }>): ResolvedNotePosition | null => {
	const target = resolveDomPath(note.anchor.domPath);
	if (!target) return null;

	const rect = target.getBoundingClientRect();
	const markerLeft = clampNumber(
		rect.left + rect.width * note.anchor.relativeX,
		12,
		window.innerWidth - 12
	);
	const markerTop = clampNumber(
		rect.top + rect.height * note.anchor.relativeY,
		12,
		window.innerHeight - 12
	);
	const bounds = {
		left: rect.left,
		top: rect.top,
		width: rect.width,
		height: rect.height
	};

	return {
		markerLeft,
		markerTop,
		bounds,
		outlineRects: [bounds],
		highlightRects: []
	};
};

const resolveTextNotePosition = (note: TextInspectorNote) => {
	const resolved = resolveTextSelection(note.anchor);
	if (!resolved) return null;

	return {
		markerLeft: resolved.markerLeft,
		markerTop: resolved.markerTop,
		bounds: resolved.bounds,
		outlineRects: resolved.bounds ? [resolved.bounds] : [],
		highlightRects: resolved.rects
	};
};

const resolveGroupNotePosition = (note: Extract<InspectorNote, { kind: 'group' | 'area' }>) => {
	if (note.kind === 'group') {
		const resolved = resolveGroupSelection(note.anchor);
		if (!resolved) return null;
		return {
			position: {
				markerLeft: resolved.markerLeft,
				markerTop: resolved.markerTop,
				bounds: resolved.bounds,
				outlineRects: resolved.rects,
				highlightRects: []
			} satisfies ResolvedNotePosition,
			resolution:
				resolved.resolvedCount === note.anchor.selectedDomPaths.length ? 'resolved' : 'partial'
		};
	}

	const resolved = resolveAreaSelection(note.anchor);
	const position: ResolvedNotePosition = {
		markerLeft: resolved.markerLeft,
		markerTop: resolved.markerTop,
		bounds: resolved.bounds,
		outlineRects: [resolved.bounds],
		highlightRects: []
	};

	return {
		position,
		resolution: 'resolved' as NoteResolutionState
	};
};

export const renderNote = (note: InspectorNote): RenderedInspectorNote => {
	if (note.kind === 'element') {
		const position = resolveElementNotePosition(note);
		return {
			...note,
			resolution: position ? 'resolved' : 'unresolved',
			position: position ?? {
				markerLeft: clampNumber(note.anchor.viewportX, 12, window.innerWidth - 12),
				markerTop: clampNumber(note.anchor.viewportY, 12, window.innerHeight - 12),
				bounds: null,
				outlineRects: [],
				highlightRects: []
			}
		};
	}

	if (note.kind === 'text') {
		const position = resolveTextNotePosition(note);
		return {
			...note,
			resolution: position ? 'resolved' : 'unresolved',
			position: position ?? {
				...markerFromFallback(note.anchor.fallbackMarker),
				bounds: null,
				outlineRects: [],
				highlightRects: []
			}
		};
	}

	const groupResult = resolveGroupNotePosition(note);
	return {
		...note,
		resolution: (groupResult?.resolution ?? 'unresolved') as NoteResolutionState,
		position: groupResult?.position ?? {
			...markerFromFallback(note.anchor.fallbackMarker),
			bounds: null,
			outlineRects: [],
			highlightRects: []
		}
	};
};

export const buildComposerState = ({
	noteId,
	noteKind,
	initialValue,
	targetSummary,
	targetLabel,
	placeholder,
	accentColor,
	markerLeft,
	markerTop,
	outlineRects,
	highlightRects,
	selectedText,
	anchor,
	sourceInfo
}: {
	noteId: string | null;
	noteKind: InspectorNote['kind'];
	initialValue: string;
	targetSummary: string;
	targetLabel: string;
	placeholder: string;
	accentColor: string;
	markerLeft: number;
	markerTop: number;
	outlineRects: RectBox[];
	highlightRects: RectBox[];
	selectedText: string | null;
	anchor: InspectorNote['anchor'];
	sourceInfo: NoteSourceInfo;
}): NoteComposerState => {
	const { panelLeft, panelTop } = getComposerPosition(markerLeft, markerTop);

	return {
		noteId,
		noteKind,
		initialValue,
		targetSummary,
		targetLabel,
		placeholder,
		accentColor,
		markerLeft,
		markerTop,
		panelLeft,
		panelTop,
		outlineRects,
		highlightRects,
		selectedText,
		anchor,
		...sourceInfo
	};
};
