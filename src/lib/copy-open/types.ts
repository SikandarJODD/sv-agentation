export type VsCodeScheme = 'vscode' | 'vscode-insiders';

export type InspectorPosition =
	| 'top-left'
	| 'top-center'
	| 'top-right'
	| 'mid-right'
	| 'mid-left'
	| 'bottom-left'
	| 'bottom-center'
	| 'bottom-right';

export interface InspectorProps {
	workspaceRoot?: string | null;
	selector?: string | null;
	vscodeScheme?: VsCodeScheme;
	openSourceOnClick?: boolean;
	deleteAllDelayMs?: number;
}

export interface InspectorRuntimeOptions {
	workspaceRoot: string | null;
	selector: string | null;
	vscodeScheme: VsCodeScheme;
	openSourceOnClick: boolean;
	deleteAllDelayMs: number;
}

export interface InspectorHoverInfo {
	componentName: string | null;
	tagName: string;
	targetLabel: string;
	filePath: string;
	shortFileName: string;
	lineNumber: number | null;
	columnNumber: number | null;
	left: number;
	top: number;
	width: number;
	height: number;
	cardLeft: number;
	cardTop: number;
	copyText: string;
	vscodeUrl: string | null;
	canCopy: boolean;
	canOpen: boolean;
}

export interface ToolbarCoordinates {
	x: number;
	y: number;
}

export type OutputDetail = 'standard' | 'detailed';
export type ThemeMode = 'dark' | 'light';
export type InspectorNoteKind = 'element' | 'text' | 'group' | 'area';
export type NoteResolutionState = 'resolved' | 'partial' | 'unresolved';

export interface NotesSettings {
	markerColor: string;
	themeMode: ThemeMode;
	blockPageInteractions: boolean;
	outputDetail: OutputDetail;
}

export interface ToolbarState {
	expanded: boolean;
	dragging: boolean;
	settingsOpen: boolean;
	confirmDeleteAll: boolean;
	notesVisible: boolean;
	copyFeedback: boolean;
	position: ToolbarCoordinates;
}

export interface RectBox {
	left: number;
	top: number;
	width: number;
	height: number;
}

export interface AbsoluteRectBox {
	left: number;
	top: number;
	width: number;
	height: number;
}

export interface NoteMarkerFallback {
	xPercent: number;
	yAbsolute: number;
}

export interface NoteSourceInfo {
	componentName: string | null;
	tagName: string;
	filePath: string;
	shortFileName: string;
	lineNumber: number | null;
	columnNumber: number | null;
}

export interface ElementNoteAnchor {
	domPath: string;
	relativeX: number;
	relativeY: number;
	viewportX: number;
	viewportY: number;
}

export interface TextSelectionAnchor {
	commonAncestorPath: string;
	selectedText: string;
	contextBefore: string;
	contextAfter: string;
	startOffset: number;
	endOffset: number;
	fallbackMarker: NoteMarkerFallback;
}

export interface GroupSelectionAnchor {
	selectedDomPaths: string[];
	anchorDomPath: string;
	bounds: AbsoluteRectBox;
	fallbackMarker: NoteMarkerFallback;
}

export interface AreaSelectionAnchor {
	bounds: AbsoluteRectBox;
	fallbackMarker: NoteMarkerFallback;
}

export type InspectorNoteAnchor =
	| ElementNoteAnchor
	| TextSelectionAnchor
	| GroupSelectionAnchor
	| AreaSelectionAnchor;

interface InspectorNoteBase extends NoteSourceInfo {
	id: string;
	kind: InspectorNoteKind;
	note: string;
	targetSummary: string;
	targetLabel: string;
	createdAt: string;
	updatedAt: string;
}

export interface ElementInspectorNote extends InspectorNoteBase {
	kind: 'element';
	anchor: ElementNoteAnchor;
}

export interface TextInspectorNote extends InspectorNoteBase {
	kind: 'text';
	anchor: TextSelectionAnchor;
}

export interface GroupInspectorNote extends InspectorNoteBase {
	kind: 'group';
	anchor: GroupSelectionAnchor;
}

export interface AreaInspectorNote extends InspectorNoteBase {
	kind: 'area';
	anchor: AreaSelectionAnchor;
}

export type InspectorNote =
	| ElementInspectorNote
	| TextInspectorNote
	| GroupInspectorNote
	| AreaInspectorNote;

export interface ResolvedNotePosition {
	markerLeft: number;
	markerTop: number;
	bounds: RectBox | null;
	outlineRects: RectBox[];
	highlightRects: RectBox[];
}

export type RenderedInspectorNote = InspectorNote & {
	resolution: NoteResolutionState;
	position: ResolvedNotePosition | null;
};

export interface NoteComposerState extends NoteSourceInfo {
	noteId: string | null;
	noteKind: InspectorNoteKind;
	initialValue: string;
	targetSummary: string;
	targetLabel: string;
	placeholder: string;
	accentColor: string;
	markerLeft: number;
	markerTop: number;
	panelLeft: number;
	panelTop: number;
	outlineRects: RectBox[];
	highlightRects: RectBox[];
	selectedText: string | null;
	anchor: InspectorNoteAnchor;
}

export interface GroupSelectionPreviewState {
	rects: RectBox[];
}

export interface DragSelectionState {
	left: number;
	top: number;
	width: number;
	height: number;
	highlightRects: RectBox[];
}
