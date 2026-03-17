import type {
	DragSelectionState,
	GroupSelectionPreviewState,
	InspectorHoverInfo,
	InspectorNote,
	InspectorPosition,
	NoteComposerState,
	NotesSettings,
	RenderedInspectorNote,
	ToolbarState
} from '../types';
import type { DeleteAllState } from './controller-state.svelte';

export interface HoverCardProps {
	hoverInfo: InspectorHoverInfo | null;
	onOpen: () => boolean;
}

export interface NoteComposerProps {
	composer: NoteComposerState | null;
	value: string;
	onCancel: () => void;
	onDelete: (noteId: string) => void;
	onInput: (value: string) => void;
	onSubmit: () => boolean;
}

export interface NoteMarkersProps {
	activeNoteId: string | null;
	composerNoteId: string | null;
	notes: RenderedInspectorNote[];
	visible: boolean;
	onOpenNote: (noteId: string) => Promise<boolean>;
}

export interface SelectionPreviewProps {
	selectionPreview: GroupSelectionPreviewState | null;
	dragSelection: DragSelectionState | null;
}

export interface InspectorToolProps {
	active: boolean;
	deleteAllState: DeleteAllState;
	notes: InspectorNote[];
	settings: NotesSettings;
	toolbar: ToolbarState;
	toolbarPosition: InspectorPosition;
	onCloseToolbar: () => void;
	onCopyNotes: () => Promise<boolean>;
	onDeleteAll: () => void;
	onSetBlockPageInteractions: (value: boolean) => void;
	onSetMarkerColor: (color: string) => void;
	onSetToolbarPosition: (position: InspectorPosition) => void;
	onToggle: () => void;
	onToggleNotesVisibility: () => void;
	onToggleSettings: () => void;
	onToggleThemeMode: () => void;
	onToggleToolbar: () => void;
	onToolbarPointerDown: (event: PointerEvent) => void;
}

export interface InspectorToolbarActionsProps {
	active: boolean;
	deleteAllState: DeleteAllState;
	notes: InspectorNote[];
	toolbar: ToolbarState;
	onCloseToolbar: () => void;
	onCopyNotes: () => Promise<boolean>;
	onDeleteAll: () => void;
	onToggle: () => void;
	onToggleNotesVisibility: () => void;
	onToggleSettings: () => void;
	onToolbarPointerDown: (event: PointerEvent) => void;
}

export interface InspectorToolbarLauncherProps {
	notes: InspectorNote[];
	onToggleToolbar: () => void;
	onToolbarPointerDown: (event: PointerEvent) => void;
}

export interface InspectorToolbarSettingsProps {
	settings: NotesSettings;
	toolbar: ToolbarState;
	toolbarPosition: InspectorPosition;
	onSetBlockPageInteractions: (value: boolean) => void;
	onSetMarkerColor: (color: string) => void;
	onSetToolbarPosition: (position: InspectorPosition) => void;
	onToggleThemeMode: () => void;
}
