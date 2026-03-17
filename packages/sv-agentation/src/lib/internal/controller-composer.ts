import type {
	AreaSelectionAnchor,
	DragSelectionState,
	ElementNoteAnchor,
	GroupSelectionAnchor,
	InspectorHoverInfo,
	InspectorNote,
	NoteComposerState,
	NoteSourceInfo,
	RectBox,
	TextSelectionAnchor
} from '../types';
import { clampNumber, resolveDomPath } from '../utils/dom';
import {
	buildAreaComposerVisuals,
	buildAreaTargetLabel,
	buildAreaTargetSummary,
	buildComposerState,
	buildElementTargetLabel,
	buildElementTargetSummary,
	buildGroupSelectionFromRects,
	buildGroupTargetLabel,
	buildGroupTargetSummary,
	buildSourceInfoFromHoverInfo,
	buildTextTargetLabel,
	buildTextTargetSummary,
	createAreaAnchorFromBounds,
	createEmptySourceInfo,
	createGroupAnchorFromElements,
	getComposerPlaceholder,
	renderNote
} from '../utils/notes';
import {
	markerFromFallback,
	resolveAreaSelection,
	resolveGroupSelection,
	resolveTextSelection
} from '../utils/selection';

export const buildAnchorFromClick = (
	target: Element,
	clientX: number,
	clientY: number,
	buildDomPath: (target: Element) => string | null
): ElementNoteAnchor | null => {
	const domPath = buildDomPath(target);
	if (domPath === null) return null;

	const rect = target.getBoundingClientRect();
	const relativeX = rect.width > 0 ? clampNumber((clientX - rect.left) / rect.width, 0, 1) : 0.5;
	const relativeY = rect.height > 0 ? clampNumber((clientY - rect.top) / rect.height, 0, 1) : 0.5;

	return {
		domPath,
		relativeX,
		relativeY,
		viewportX: clientX,
		viewportY: clientY
	};
};

export const buildElementComposer = ({
	target,
	noteId,
	initialValue,
	hoverInfo,
	markerColor,
	anchor
}: {
	target: Element;
	noteId: string | null;
	initialValue: string;
	hoverInfo: InspectorHoverInfo;
	markerColor: string;
	anchor: ElementNoteAnchor;
}) => {
	const rect = target.getBoundingClientRect();
	const markerLeft = clampNumber(
		rect.left + rect.width * anchor.relativeX,
		12,
		window.innerWidth - 12
	);
	const markerTop = clampNumber(
		rect.top + rect.height * anchor.relativeY,
		12,
		window.innerHeight - 12
	);

	return buildComposerState({
		noteId,
		noteKind: 'element',
		initialValue,
		targetSummary: buildElementTargetSummary(target),
		targetLabel: buildElementTargetLabel(target),
		placeholder: getComposerPlaceholder('element'),
		accentColor: markerColor,
		markerLeft,
		markerTop,
		outlineRects: [
			{
				left: rect.left,
				top: rect.top,
				width: rect.width,
				height: rect.height
			}
		],
		highlightRects: [],
		selectedText: null,
		anchor,
		sourceInfo: buildSourceInfoFromHoverInfo(hoverInfo)
	});
};

export const buildTextComposer = ({
	selection,
	sourceInfo,
	markerColor
}: {
	selection: NonNullable<ReturnType<typeof import('../utils/selection').serializeTextSelection>>;
	sourceInfo: NoteSourceInfo;
	markerColor: string;
}) =>
	buildComposerState({
		noteId: null,
		noteKind: 'text',
		initialValue: '',
		targetSummary: buildTextTargetSummary(selection.commonAncestor, selection.anchor.selectedText),
		targetLabel: buildTextTargetLabel(selection.commonAncestor),
		placeholder: getComposerPlaceholder('text'),
		accentColor: markerColor,
		markerLeft: selection.markerLeft,
		markerTop: selection.markerTop,
		outlineRects: selection.bounds ? [selection.bounds] : [],
		highlightRects: selection.rects,
		selectedText: selection.anchor.selectedText,
		anchor: selection.anchor,
		sourceInfo
	});

export const buildGroupComposer = ({
	elements,
	anchorElement,
	sourceInfo,
	markerColor
}: {
	elements: Element[];
	anchorElement: Element;
	sourceInfo: NoteSourceInfo;
	markerColor: string;
}) => {
	const rects = elements.map((element) => {
		const rect = element.getBoundingClientRect();
		return {
			left: rect.left,
			top: rect.top,
			width: rect.width,
			height: rect.height
		};
	});
	const visuals = buildGroupSelectionFromRects(rects);
	if (!visuals) return null;

	const anchorData = createGroupAnchorFromElements(
		elements,
		anchorElement,
		visuals.markerLeft,
		visuals.markerTop
	);
	if (!anchorData) return null;

	return buildComposerState({
		noteId: null,
		noteKind: 'group',
		initialValue: '',
		targetSummary: buildGroupTargetSummary(elements),
		targetLabel: buildGroupTargetLabel(elements),
		placeholder: getComposerPlaceholder('group', elements.length),
		accentColor: markerColor,
		markerLeft: visuals.markerLeft,
		markerTop: visuals.markerTop,
		outlineRects: anchorData.rects,
		highlightRects: [],
		selectedText: null,
		anchor: anchorData.anchor,
		sourceInfo
	});
};

export const buildAreaComposer = ({
	selection,
	markerColor
}: {
	selection: DragSelectionState;
	markerColor: string;
}) => {
	const visuals = buildAreaComposerVisuals(selection);
	const anchor = createAreaAnchorFromBounds(selection, visuals.markerLeft, visuals.markerTop);

	return buildComposerState({
		noteId: null,
		noteKind: 'area',
		initialValue: '',
		targetSummary: buildAreaTargetSummary(),
		targetLabel: buildAreaTargetLabel(selection),
		placeholder: getComposerPlaceholder('area'),
		accentColor: markerColor,
		markerLeft: visuals.markerLeft,
		markerTop: visuals.markerTop,
		outlineRects: [selection],
		highlightRects: [],
		selectedText: null,
		anchor,
		sourceInfo: createEmptySourceInfo()
	});
};

export const buildNoteFromComposer = ({
	composer,
	noteText,
	existingNote,
	createNoteId
}: {
	composer: NoteComposerState;
	noteText: string;
	existingNote: InspectorNote | null;
	createNoteId: () => string;
}): InspectorNote => {
	const now = new Date().toISOString();

	return {
		id: existingNote?.id ?? createNoteId(),
		kind: composer.noteKind,
		note: noteText,
		targetSummary: composer.targetSummary,
		targetLabel: composer.targetLabel,
		componentName: composer.componentName,
		tagName: composer.tagName,
		filePath: composer.filePath,
		shortFileName: composer.shortFileName,
		lineNumber: composer.lineNumber,
		columnNumber: composer.columnNumber,
		createdAt: existingNote?.createdAt ?? now,
		updatedAt: now,
		anchor: composer.anchor
	} as InspectorNote;
};

export const buildComposerFromExistingNote = ({
	note,
	markerColor
}: {
	note: InspectorNote;
	markerColor: string;
}) => {
	const renderedNote = renderNote(note);
	const fallbackMarker = getFallbackMarkerForNote(note);
	const markerLeft = renderedNote.position?.markerLeft ?? fallbackMarker.markerLeft;
	const markerTop = renderedNote.position?.markerTop ?? fallbackMarker.markerTop;
	const outlineRects = renderedNote.position?.outlineRects ?? [];
	const highlightRects = renderedNote.position?.highlightRects ?? [];

	return buildComposerState({
		noteId: note.id,
		noteKind: note.kind,
		initialValue: note.note,
		targetSummary: note.targetSummary,
		targetLabel: note.targetLabel,
		placeholder:
			note.kind === 'group'
				? getComposerPlaceholder('group', note.anchor.selectedDomPaths.length)
				: getComposerPlaceholder(note.kind),
		accentColor: markerColor,
		markerLeft,
		markerTop,
		outlineRects,
		highlightRects,
		selectedText: note.kind === 'text' ? note.anchor.selectedText : null,
		anchor: note.anchor,
		sourceInfo: {
			componentName: note.componentName,
			tagName: note.tagName,
			filePath: note.filePath,
			shortFileName: note.shortFileName,
			lineNumber: note.lineNumber,
			columnNumber: note.columnNumber
		}
	});
};

export const getFallbackMarkerForNote = (note: InspectorNote) => {
	switch (note.kind) {
		case 'element':
			return {
				markerLeft: clampNumber(note.anchor.viewportX, 12, window.innerWidth - 12),
				markerTop: clampNumber(note.anchor.viewportY, 12, window.innerHeight - 12)
			};
		case 'text':
		case 'group':
		case 'area':
			return markerFromFallback(note.anchor.fallbackMarker);
	}
};

export const resolveComposerLayout = (composer: NoteComposerState) => {
	switch (composer.noteKind) {
		case 'element': {
			const target = resolveDomPath((composer.anchor as ElementNoteAnchor).domPath);
			if (!target) {
				const anchor = composer.anchor as ElementNoteAnchor;
				return {
					markerLeft: clampNumber(anchor.viewportX, 12, window.innerWidth - 12),
					markerTop: clampNumber(anchor.viewportY, 12, window.innerHeight - 12),
					outlineRects: [],
					highlightRects: []
				};
			}

			const rect = target.getBoundingClientRect();
			const anchor = composer.anchor as ElementNoteAnchor;
			return {
				markerLeft: clampNumber(rect.left + rect.width * anchor.relativeX, 12, window.innerWidth - 12),
				markerTop: clampNumber(rect.top + rect.height * anchor.relativeY, 12, window.innerHeight - 12),
				outlineRects: [
					{
						left: rect.left,
						top: rect.top,
						width: rect.width,
						height: rect.height
					}
				],
				highlightRects: []
			};
		}
		case 'text': {
			const resolved = resolveTextSelection(composer.anchor as TextSelectionAnchor);
			if (!resolved) {
				const fallback = markerFromFallback((composer.anchor as TextSelectionAnchor).fallbackMarker);
				return {
					markerLeft: fallback.markerLeft,
					markerTop: fallback.markerTop,
					outlineRects: [],
					highlightRects: []
				};
			}

			return {
				markerLeft: resolved.markerLeft,
				markerTop: resolved.markerTop,
				outlineRects: resolved.bounds ? [resolved.bounds] : [],
				highlightRects: resolved.rects
			};
		}
		case 'group': {
			const resolved = resolveGroupSelection(composer.anchor as GroupSelectionAnchor);
			if (!resolved) {
				const fallback = markerFromFallback((composer.anchor as GroupSelectionAnchor).fallbackMarker);
				return {
					markerLeft: fallback.markerLeft,
					markerTop: fallback.markerTop,
					outlineRects: [],
					highlightRects: []
				};
			}

			return {
				markerLeft: resolved.markerLeft,
				markerTop: resolved.markerTop,
				outlineRects: resolved.rects,
				highlightRects: []
			};
		}
		case 'area': {
			const resolved = resolveAreaSelection(composer.anchor as AreaSelectionAnchor);
			return {
				markerLeft: resolved.markerLeft,
				markerTop: resolved.markerTop,
				outlineRects: [resolved.bounds],
				highlightRects: []
			};
		}
	}
};

export const updateComposerPosition = (
	composer: NoteComposerState,
	nextLayout: {
		markerLeft: number;
		markerTop: number;
		outlineRects: RectBox[];
		highlightRects: RectBox[];
	}
) =>
	buildComposerState({
		noteId: composer.noteId,
		noteKind: composer.noteKind,
		initialValue: composer.initialValue,
		targetSummary: composer.targetSummary,
		targetLabel: composer.targetLabel,
		placeholder: composer.placeholder,
		accentColor: composer.accentColor,
		markerLeft: nextLayout.markerLeft,
		markerTop: nextLayout.markerTop,
		outlineRects: nextLayout.outlineRects,
		highlightRects: nextLayout.highlightRects,
		selectedText: composer.selectedText,
		anchor: composer.anchor,
		sourceInfo: {
			componentName: composer.componentName,
			tagName: composer.tagName,
			filePath: composer.filePath,
			shortFileName: composer.shortFileName,
			lineNumber: composer.lineNumber,
			columnNumber: composer.columnNumber
		}
	});

export const scrollNoteIntoView = async (note: InspectorNote) => {
	switch (note.kind) {
		case 'element': {
			const target = resolveDomPath(note.anchor.domPath);
			target?.scrollIntoView({
				block: 'center',
				inline: 'nearest',
				behavior: 'smooth'
			});
			return;
		}
		case 'text': {
			const target = resolveDomPath(note.anchor.commonAncestorPath);
			target?.scrollIntoView({
				block: 'center',
				inline: 'nearest',
				behavior: 'smooth'
			});
			return;
		}
		case 'group': {
			const target =
				resolveDomPath(note.anchor.anchorDomPath) ??
				resolveDomPath(note.anchor.selectedDomPaths[0] ?? '');
			target?.scrollIntoView({
				block: 'center',
				inline: 'nearest',
				behavior: 'smooth'
			});
			return;
		}
		case 'area': {
			window.scrollTo({
				top: Math.max(0, note.anchor.bounds.top - window.innerHeight / 2),
				behavior: 'smooth'
			});
		}
	}
};
