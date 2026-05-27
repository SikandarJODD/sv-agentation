import { describe, expect, it } from 'vitest';

import type {
	AgentationAnnotationSnapshot,
	AgentationExportPayload,
	AgentationInspectorProps,
	AgentationKeyAction,
	AgentationKeyBindingValue,
	AgentationKeyBindings,
	AgentationProps,
	Annotation,
	AnnotationPayload,
	AnnotationProps,
	InspectorProps,
	KeyAction,
	KeyBindingValue,
	KeyBindings,
	ResolvedAgentationKeyBindings,
	ResolvedKeyBindings
} from '../src/lib';

type Assert<T extends true> = T;
type IsAssignable<From, To> = From extends To ? true : false;

type _annotationCompatA = Assert<IsAssignable<Annotation, AgentationAnnotationSnapshot>>;
type _annotationCompatB = Assert<IsAssignable<AgentationAnnotationSnapshot, Annotation>>;
type _payloadCompatA = Assert<IsAssignable<AnnotationPayload, AgentationExportPayload>>;
type _payloadCompatB = Assert<IsAssignable<AgentationExportPayload, AnnotationPayload>>;
type _propsCompatA = Assert<IsAssignable<AnnotationProps, AgentationProps>>;
type _propsCompatB = Assert<IsAssignable<AnnotationProps, AgentationInspectorProps>>;
type _propsCompatC = Assert<IsAssignable<AnnotationProps, InspectorProps>>;
type _keyActionCompatA = Assert<IsAssignable<KeyAction, AgentationKeyAction>>;
type _keyActionCompatB = Assert<IsAssignable<AgentationKeyAction, KeyAction>>;
type _keyBindingValueCompatA = Assert<IsAssignable<KeyBindingValue, AgentationKeyBindingValue>>;
type _keyBindingValueCompatB = Assert<IsAssignable<AgentationKeyBindingValue, KeyBindingValue>>;
type _keyBindingsCompatA = Assert<IsAssignable<KeyBindings, AgentationKeyBindings>>;
type _keyBindingsCompatB = Assert<IsAssignable<AgentationKeyBindings, KeyBindings>>;
type _resolvedKeyBindingsCompatA = Assert<
	IsAssignable<ResolvedKeyBindings, ResolvedAgentationKeyBindings>
>;
type _resolvedKeyBindingsCompatB = Assert<
	IsAssignable<ResolvedAgentationKeyBindings, ResolvedKeyBindings>
>;

describe('public type exports', () => {
	it('keeps canonical and deprecated aliases compatible', () => {
		expect(true).toBe(true);
	});
});
