import { resolveElementInfo } from 'element-source';

import type {
	InspectorHoverInfo,
	InspectorPosition,
	InspectorRuntimeOptions,
	VsCodeScheme
} from './types';
import {
	isElementTarget,
	isInspectorUiTarget,
	isTypingTarget,
	resolveInspectableTarget
} from './utils/dom';
import {
	DEFAULT_INSPECTOR_POSITION,
	isInspectorPosition,
	readStoredPosition,
	writeStoredPosition
} from './utils/position';
import { buildHoverInfo } from './utils/source';

const DEFAULT_OPTIONS: InspectorRuntimeOptions = {
	workspaceRoot: null,
	selector: null,
	vscodeScheme: 'vscode',
	openSourceOnClick: false
};

type ViewTransitionDocument = Document & {
	startViewTransition?: (update: () => void) => void;
};

const runWithViewTransition = (update: () => void) => {
	if (typeof document === 'undefined') {
		update();
		return;
	}

	const transitionDocument = document as ViewTransitionDocument;
	if (typeof transitionDocument.startViewTransition === 'function') {
		transitionDocument.startViewTransition(update);
		return;
	}

	update();
};

export class CopyOpenController {
	enabled = $state(false);
	position = $state<InspectorPosition>(DEFAULT_INSPECTOR_POSITION);
	hoverInfo = $state<InspectorHoverInfo | null>(null);
	copied = $state(false);
	menuOpen = $state(false);

	#lastTarget: Element | null = null;
	#workspaceRoot: string | null = DEFAULT_OPTIONS.workspaceRoot;
	#selector: string | null = DEFAULT_OPTIONS.selector;
	#vscodeScheme: VsCodeScheme = DEFAULT_OPTIONS.vscodeScheme;
	#openSourceOnClick = DEFAULT_OPTIONS.openSourceOnClick;
	#copyResetTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(options: Partial<InspectorRuntimeOptions> = {}) {
		this.updateOptions(options);
		this.position = readStoredPosition();
	}

	updateOptions(options: Partial<InspectorRuntimeOptions>) {
		if ('workspaceRoot' in options) {
			this.#workspaceRoot = options.workspaceRoot ?? DEFAULT_OPTIONS.workspaceRoot;
		}

		if ('selector' in options) {
			this.#selector = options.selector ?? DEFAULT_OPTIONS.selector;
		}

		if ('vscodeScheme' in options) {
			this.#vscodeScheme = options.vscodeScheme ?? DEFAULT_OPTIONS.vscodeScheme;
		}

		if ('openSourceOnClick' in options) {
			this.#openSourceOnClick = options.openSourceOnClick ?? DEFAULT_OPTIONS.openSourceOnClick;
		}
	}

	toggle = () => {
		this.enabled = !this.enabled;
		if (!this.enabled) {
			this.clearHover();
		}
	};

	toggleMenu = () => {
		this.menuOpen = !this.menuOpen;
	};

	setPosition = (value: string) => {
		if (!isInspectorPosition(value)) return;

		runWithViewTransition(() => {
			this.position = value;
			this.menuOpen = false;
			writeStoredPosition(value);
		});
	};

	clearHover = () => {
		this.#lastTarget = null;
		this.hoverInfo = null;
		this.copied = false;
		this.#clearCopyResetTimer();
	};

	handleViewportChange = () => {
		this.clearHover();
	};

	handlePointerMove = async (event: PointerEvent) => {
		if (!this.enabled) return;

		const target = resolveInspectableTarget(event.target, this.#selector);
		if (!target) {
			if (isElementTarget(event.target) && isInspectorUiTarget(event.target)) {
				return;
			}

			this.clearHover();
			return;
		}

		if (target === this.#lastTarget) return;
		this.#lastTarget = target;

		const elementInfo = await resolveElementInfo(target);
		if (this.#lastTarget !== target) return;

		this.copied = false;
		this.#clearCopyResetTimer();
		this.hoverInfo = buildHoverInfo(target, elementInfo, {
			workspaceRoot: this.#workspaceRoot,
			vscodeScheme: this.#vscodeScheme
		});
	};

	copy = async () => {
		if (!this.hoverInfo?.canCopy) return false;

		try {
			await navigator.clipboard.writeText(this.hoverInfo.copyText);
			this.copied = true;
			this.#scheduleCopyReset();
			return true;
		} catch {
			return false;
		}
	};

	open = (hoverInfo: InspectorHoverInfo | null = this.hoverInfo) => {
		if (!hoverInfo?.canOpen || !hoverInfo.vscodeUrl) return false;

		window.location.href = hoverInfo.vscodeUrl;
		return true;
	};

	handleClick = async (event: MouseEvent) => {
		if (!this.enabled || !this.#openSourceOnClick) return;
		if (event.defaultPrevented) return;
		if (event.button !== 0) return;

		const target = resolveInspectableTarget(event.target, this.#selector);
		if (!target) return;

		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation();

		if (target !== this.#lastTarget || !this.hoverInfo) {
			this.#lastTarget = target;

			const elementInfo = await resolveElementInfo(target);
			if (this.#lastTarget !== target) return;

			this.copied = false;
			this.#clearCopyResetTimer();
			this.hoverInfo = buildHoverInfo(target, elementInfo, {
				workspaceRoot: this.#workspaceRoot,
				vscodeScheme: this.#vscodeScheme
			});
		}

		this.open(this.hoverInfo);
	};

	handleKeyDown = async (event: KeyboardEvent) => {
		if (event.defaultPrevented) return;
		if (event.metaKey || event.ctrlKey || event.altKey) return;
		if (isTypingTarget(event.target)) return;

		const key = event.key.toLowerCase();
		if (key === 'i') {
			event.preventDefault();
			this.toggle();
			return;
		}

		if (!this.enabled) return;

		if (key === 'c') {
			event.preventDefault();
			await this.copy();
			return;
		}

		if (key === 'o') {
			event.preventDefault();
			this.open();
		}
	};

	destroy() {
		this.#clearCopyResetTimer();
	}

	#scheduleCopyReset() {
		this.#clearCopyResetTimer();
		this.#copyResetTimer = window.setTimeout(() => {
			this.copied = false;
			this.#copyResetTimer = null;
		}, 1000);
	}

	#clearCopyResetTimer() {
		if (this.#copyResetTimer === null) return;
		window.clearTimeout(this.#copyResetTimer);
		this.#copyResetTimer = null;
	}
}
