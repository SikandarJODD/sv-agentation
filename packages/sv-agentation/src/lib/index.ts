export { default as Agentation } from './element-source-inspector.svelte';
export { default as AgentationInspector } from './element-source-inspector.svelte';
export { default as ElementSourceInspector } from './element-source-inspector.svelte';
export {
	AGENTATION_ACTIVE_CHANGE_EVENT,
	AGENTATION_BLOCKED_INTERACTION_EVENT,
	COPY_OPEN_ACTIVE_CHANGE_EVENT,
	COPY_OPEN_BLOCKED_INTERACTION_EVENT,
	INSPECTOR_ACTIVE_CHANGE_EVENT,
	INSPECTOR_BLOCKED_INTERACTION_EVENT
} from './events';
import type {
	AgentationAnnotationSnapshot as InternalAnnotation,
	AgentationExportPayload as InternalAnnotationPayload,
	AgentationKeyAction as InternalKeyAction,
	AgentationKeyBindingValue as InternalKeyBindingValue,
	AgentationKeyBindings as InternalKeyBindings,
	InspectorProps as InternalInspectorProps,
	ResolvedAgentationKeyBindings as InternalResolvedKeyBindings
} from './types';
export type {
	AbsoluteRectBox,
	AnnotationBoundingBox,
	AnnotationCapture,
	AnnotationComponentContext,
	AnnotationElementSnapshot,
	AnnotationPageSnapshot,
	AnnotationPosition,
	AreaSelectionAnchor,
	AreaInspectorNote,
	ComponentContextMode,
	ComputedStyleSnapshot,
	DragSelectionState,
	ElementNoteAnchor,
	ElementInspectorNote,
	GroupInspectorNote,
	GroupSelectionAnchor,
	GroupSelectionPreviewState,
	InspectorHoverInfo,
	InspectorNoteAnchor,
	InspectorNoteKind,
	InspectorNote,
	InspectorPosition,
	InspectorRuntimeOptions,
	NoteMarkerFallback,
	NoteResolutionState,
	NoteSourceInfo,
	NoteComposerState,
	NotesSettings,
	OutputMode,
	RectBox,
	RenderedInspectorNote,
	ResolvedNotePosition,
	TextInspectorNote,
	TextSelectionAnchor,
	ToolbarCoordinates,
	ToolbarState,
	VsCodeScheme
} from './types';
export type { InspectorActiveChangeDetail, InspectorBlockedInteractionDetail } from './events';

export type Annotation = InternalAnnotation;
export type AnnotationPayload = InternalAnnotationPayload;
export type AnnotationProps = InternalInspectorProps;
export type KeyAction = InternalKeyAction;
export type KeyBindingValue = InternalKeyBindingValue;
export type KeyBindings = InternalKeyBindings;
export type ResolvedKeyBindings = InternalResolvedKeyBindings;

/** @deprecated Use `Annotation` instead. */
export type AgentationAnnotationSnapshot = InternalAnnotation;
/** @deprecated Use `AnnotationPayload` instead. */
export type AgentationExportPayload = InternalAnnotationPayload;
/** @deprecated Use `AnnotationProps` instead. */
export type AgentationProps = InternalInspectorProps;
/** @deprecated Use `AnnotationProps` instead. */
export type AgentationInspectorProps = InternalInspectorProps;
/** @deprecated Use `AnnotationProps` instead. */
export type InspectorProps = InternalInspectorProps;
/** @deprecated Use `KeyAction` instead. */
export type AgentationKeyAction = InternalKeyAction;
/** @deprecated Use `KeyBindingValue` instead. */
export type AgentationKeyBindingValue = InternalKeyBindingValue;
/** @deprecated Use `KeyBindings` instead. */
export type AgentationKeyBindings = InternalKeyBindings;
/** @deprecated Use `ResolvedKeyBindings` instead. */
export type ResolvedAgentationKeyBindings = InternalResolvedKeyBindings;
