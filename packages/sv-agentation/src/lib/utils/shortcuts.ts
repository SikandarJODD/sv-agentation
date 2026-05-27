import type {
	AgentationKeyAction,
	AgentationKeyBindingValue,
	AgentationKeyBindings,
	ResolvedAgentationKeyBindings
} from '../types';

export const KEY_BINDING_ACTION_ORDER: AgentationKeyAction[] = [
	'inspect',
	'copy',
	'reset',
	'open',
	'delete',
	'cancel',
	'submit'
];

export const DEFAULT_KEY_BINDINGS: ResolvedAgentationKeyBindings = {
	inspect: 'I',
	copy: 'C',
	reset: 'R',
	open: 'O',
	delete: 'D',
	cancel: 'Escape',
	submit: 'Enter'
};

const MODIFIER_LABELS = {
	ctrl: 'Ctrl',
	meta: 'Meta',
	alt: 'Alt',
	shift: 'Shift',
	mod: 'Mod'
} as const;

const canWarn = () => {
	if (typeof import.meta !== 'undefined' && import.meta.env) {
		return Boolean(import.meta.env.DEV);
	}

	return typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
};

const warnInvalidBinding = (action: AgentationKeyAction, binding: AgentationKeyBindingValue) => {
	if (!canWarn()) return;

	console.warn(
		`[sv-agentation] Ignoring invalid key binding for "${action}": ${String(binding)}. Falling back to the default binding.`
	);
};

const warnDuplicateBinding = (
	action: AgentationKeyAction,
	binding: string,
	existingAction: AgentationKeyAction
) => {
	if (!canWarn()) return;

	console.warn(
		`[sv-agentation] Ignoring duplicate key binding "${binding}" for "${action}" because it is already used by "${existingAction}".`
	);
};

const normalizeModifier = (token: string) => {
	switch (token) {
		case 'cmd':
		case 'command':
			return 'meta';
		case 'control':
		case 'ctl':
			return 'ctrl';
		case 'option':
			return 'alt';
		case 'mod':
			return 'mod';
		default:
			return token;
	}
};

const normalizeKeyName = (token: string) => {
	switch (token) {
		case 'esc':
			return 'escape';
		case 'return':
			return 'enter';
		case 'spacebar':
			return 'space';
		default:
			return token;
	}
};

const formatDisplayKey = (key: string) => {
	if (key === 'escape') return 'Escape';
	if (key === 'enter') return 'Enter';
	if (key === 'space') return 'Space';
	if (key.length === 1) return key.toUpperCase();
	return key.slice(0, 1).toUpperCase() + key.slice(1);
};

const buildSignature = (binding: ParsedKeyBinding) =>
	[
		binding.mod ? 'mod' : '',
		binding.ctrl ? 'ctrl' : '',
		binding.meta ? 'meta' : '',
		binding.alt ? 'alt' : '',
		binding.shift ? 'shift' : '',
		binding.key
	]
		.filter(Boolean)
		.join('+');

export interface ParsedKeyBinding {
	key: string;
	ctrl: boolean;
	meta: boolean;
	alt: boolean;
	shift: boolean;
	mod: boolean;
	label: string;
	signature: string;
}

export type ParsedKeyBindings = Record<AgentationKeyAction, ParsedKeyBinding | null>;

export const parseKeyBinding = (binding: AgentationKeyBindingValue): ParsedKeyBinding | null => {
	if (binding === null) return null;
	if (typeof binding !== 'string') return null;

	const tokens = binding
		.split('+')
		.map((token) => token.trim().toLowerCase())
		.filter(Boolean);

	if (tokens.length === 0) return null;

	let ctrl = false;
	let meta = false;
	let alt = false;
	let shift = false;
	let mod = false;
	let key: string | null = null;

	for (const token of tokens) {
		const normalizedToken = normalizeModifier(normalizeKeyName(token));

		if (normalizedToken === 'ctrl') {
			ctrl = true;
			continue;
		}
		if (normalizedToken === 'meta') {
			meta = true;
			continue;
		}
		if (normalizedToken === 'alt') {
			alt = true;
			continue;
		}
		if (normalizedToken === 'shift') {
			shift = true;
			continue;
		}
		if (normalizedToken === 'mod') {
			mod = true;
			continue;
		}

		if (key !== null) return null;
		key = normalizeKeyName(normalizedToken);
	}

	if (key === null) return null;
	if (mod && (ctrl || meta)) return null;

	const label = [
		mod ? MODIFIER_LABELS.mod : null,
		ctrl ? MODIFIER_LABELS.ctrl : null,
		meta ? MODIFIER_LABELS.meta : null,
		alt ? MODIFIER_LABELS.alt : null,
		shift ? MODIFIER_LABELS.shift : null,
		formatDisplayKey(key)
	]
		.filter((part): part is string => part !== null)
		.join('+');

	const parsedBinding: ParsedKeyBinding = {
		key,
		ctrl,
		meta,
		alt,
		shift,
		mod,
		label,
		signature: ''
	};
	parsedBinding.signature = buildSignature(parsedBinding);

	return parsedBinding;
};

export const resolveKeyBindings = (
	overrides: AgentationKeyBindings | undefined
): {
	keyBindings: ResolvedAgentationKeyBindings;
	parsedKeyBindings: ParsedKeyBindings;
} => {
	const keyBindings = { ...DEFAULT_KEY_BINDINGS };
	const parsedKeyBindings = Object.fromEntries(
		KEY_BINDING_ACTION_ORDER.map((action) => [action, null])
	) as ParsedKeyBindings;
	const usedSignatures = new Map<string, AgentationKeyAction>();

	for (const action of KEY_BINDING_ACTION_ORDER) {
		const override = overrides?.[action];
		const candidate = override === undefined ? DEFAULT_KEY_BINDINGS[action] : override;

		if (candidate === null) {
			keyBindings[action] = null;
			parsedKeyBindings[action] = null;
			continue;
		}

		let parsedBinding = parseKeyBinding(candidate);
		if (!parsedBinding) {
			warnInvalidBinding(action, candidate);
			parsedBinding = parseKeyBinding(DEFAULT_KEY_BINDINGS[action]);
			if (!parsedBinding) {
				keyBindings[action] = null;
				parsedKeyBindings[action] = null;
				continue;
			}
		}

		const existingAction = usedSignatures.get(parsedBinding.signature);
		if (existingAction) {
			warnDuplicateBinding(action, parsedBinding.label, existingAction);
			keyBindings[action] = null;
			parsedKeyBindings[action] = null;
			continue;
		}

		usedSignatures.set(parsedBinding.signature, action);
		keyBindings[action] = parsedBinding.label;
		parsedKeyBindings[action] = parsedBinding;
	}

	return { keyBindings, parsedKeyBindings };
};

export const matchesKeyBinding = (
	event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>,
	binding: ParsedKeyBinding | AgentationKeyBindingValue
) => {
	const parsedBinding = typeof binding === 'string' || binding === null ? parseKeyBinding(binding) : binding;
	if (!parsedBinding) return false;

	const eventKey = normalizeKeyName(event.key.trim().toLowerCase());
	if (eventKey !== parsedBinding.key) return false;

	const modPressed = event.ctrlKey || event.metaKey;
	if (parsedBinding.mod) {
		return (
			modPressed &&
			parsedBinding.alt === event.altKey &&
			parsedBinding.shift === event.shiftKey
		);
	}

	return (
		parsedBinding.ctrl === event.ctrlKey &&
		parsedBinding.meta === event.metaKey &&
		parsedBinding.alt === event.altKey &&
		parsedBinding.shift === event.shiftKey
	);
};
