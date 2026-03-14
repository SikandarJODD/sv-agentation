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
}

export interface InspectorRuntimeOptions {
	workspaceRoot: string | null;
	selector: string | null;
	vscodeScheme: VsCodeScheme;
	openSourceOnClick: boolean;
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

export interface NotesSettings {
	markerColor: string;
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

export interface ElementNoteAnchor {
	domPath: string;
	relativeX: number;
	relativeY: number;
	viewportX: number;
	viewportY: number;
}

export interface InspectorNote {
	id: string;
	note: string;
	color: string;
	targetSummary: string;
	componentName: string | null;
	tagName: string;
	filePath: string;
	shortFileName: string;
	lineNumber: number | null;
	columnNumber: number | null;
	createdAt: string;
	updatedAt: string;
	anchor: ElementNoteAnchor;
}

export interface ResolvedNotePosition {
	left: number;
	top: number;
	width: number;
	height: number;
	markerLeft: number;
	markerTop: number;
}

export interface RenderedInspectorNote extends InspectorNote {
	resolved: boolean;
	position: ResolvedNotePosition | null;
}

export interface NoteComposerState {
	noteId: string | null;
	initialValue: string;
	targetSummary: string;
	targetLabel: string;
	markerLeft: number;
	markerTop: number;
	panelLeft: number;
	panelTop: number;
	targetRect: {
		left: number;
		top: number;
		width: number;
		height: number;
	};
	anchor: ElementNoteAnchor;
	hoverInfo: InspectorHoverInfo;
}
