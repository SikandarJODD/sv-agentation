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
