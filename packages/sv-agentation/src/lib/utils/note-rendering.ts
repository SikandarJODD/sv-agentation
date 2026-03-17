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

const isPointVisibleInViewport = (left: number, top: number) =>
	left >= 0 && left <= window.innerWidth && top >= 0 && top <= window.innerHeight;

const isRectVisibleInViewport = (bounds: RectBox | null) => {
	if (!bounds) return false;

	return (
		bounds.left + bounds.width >= 0 &&
		bounds.top + bounds.height >= 0 &&
		bounds.left <= window.innerWidth &&
		bounds.top <= window.innerHeight
	);
};

const isResolvedPositionVisible = (bounds: RectBox | null, markerLeft: number, markerTop: number) =>
	isRectVisibleInViewport(bounds) || isPointVisibleInViewport(markerLeft, markerTop);

const resolveElementNotePosition = (note: Extract<InspectorNote, { kind: 'element' }>): ResolvedNotePosition | null => {
	const target = resolveDomPath(note.anchor.domPath);
	if (!target) return null;

	const rect = target.getBoundingClientRect();
	const markerLeft = rect.left + rect.width * note.anchor.relativeX;
	const markerTop = rect.top + rect.height * note.anchor.relativeY;
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
		highlightRects: [],
		visibleInViewport: isResolvedPositionVisible(bounds, markerLeft, markerTop)
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
		highlightRects: resolved.rects,
		visibleInViewport: isResolvedPositionVisible(
			resolved.bounds,
			resolved.markerLeft,
			resolved.markerTop
		)
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
				highlightRects: [],
				visibleInViewport: isResolvedPositionVisible(
					resolved.bounds,
					resolved.markerLeft,
					resolved.markerTop
				)
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
		highlightRects: [],
		visibleInViewport: isResolvedPositionVisible(
			resolved.bounds,
			resolved.markerLeft,
			resolved.markerTop
		)
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
				highlightRects: [],
				visibleInViewport: true
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
				highlightRects: [],
				visibleInViewport: true
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
			highlightRects: [],
			visibleInViewport: true
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
