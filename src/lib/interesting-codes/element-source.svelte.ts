import {
	formatStack,
	resolveComponentName,
	resolveElementInfo,
	resolveSource,
	resolveStack,
	type ElementInfo,
	type ElementSourceInfo
} from 'element-source';

export interface InspectionErrorState {
	message: string;
	reason: 'missing-target' | 'invalid-target' | 'inspect-failed';
}

export interface InspectionResult {
	tagName: string;
	componentName: string | null;
	source: ElementSourceInfo | null;
	stack: ElementSourceInfo[];
	formattedStack: string;
}

const INVALID_TARGET_ERROR = 'Pass a real DOM element from bind:this or an event target.';

export class ElementSourceController {
	target = $state<HTMLElement | null>(null);
	inspecting = $state(false);
	loading = $state(false);
	error = $state<string | null>(null);
	info = $state<InspectionResult | null>(null);
	formattedStack = $state('');

	#request_id = 0;

	setTarget(element: HTMLElement | null) {
		this.target = element;
	}

	clear() {
		this.loading = false;
		this.error = null;
		this.info = null;
		this.formattedStack = '';
	}

	toggleInspecting() {
		this.inspecting = !this.inspecting;
	}

	async inspect(element: Element | null = this.target) {
		if (element === null) {
			this.#setError({ message: 'No element selected yet. Bind or click an element first.', reason: 'missing-target' });
			return null;
		}

		if (!(element instanceof Element)) {
			this.#setError({ message: INVALID_TARGET_ERROR, reason: 'invalid-target' });
			return null;
		}

		const request_id = ++this.#request_id;
		this.loading = true;
		this.error = null;

		try {
			const [elementInfo, source, stack, componentName] = await Promise.all([
				resolveElementInfo(element),
				resolveSource(element),
				resolveStack(element),
				resolveComponentName(element)
			]);

			if (request_id !== this.#request_id) {
				return null;
			}

			const next_info = this.#createInspectionResult(elementInfo, source, stack, componentName);
			this.info = next_info;
			this.formattedStack = next_info.formattedStack;
			return next_info;
		} catch (error) {
			if (request_id !== this.#request_id) {
				return null;
			}

			this.#setError({
				message: error instanceof Error ? error.message : 'Element inspection failed.',
				reason: 'inspect-failed'
			});
			return null;
		} finally {
			if (request_id === this.#request_id) {
				this.loading = false;
			}
		}
	}

	inspectFromEventTarget(target: EventTarget | null) {
		if (target instanceof Element) {
			return this.inspect(target);
		}

		this.#setError({ message: INVALID_TARGET_ERROR, reason: 'invalid-target' });
		return Promise.resolve(null);
	}

	#createInspectionResult(
		elementInfo: ElementInfo,
		source: ElementSourceInfo | null,
		stack: ElementSourceInfo[],
		componentName: string | null
	): InspectionResult {
		const formattedStack = stack.length > 0 ? formatStack(stack) : 'No source stack returned for this element.';

		return {
			tagName: elementInfo.tagName,
			componentName: componentName ?? elementInfo.componentName,
			source: source ?? elementInfo.source,
			stack,
			formattedStack
		};
	}

	#setError(errorState: InspectionErrorState) {
		this.error = errorState.message;
		this.info = null;
		this.formattedStack = '';
		this.loading = false;
	}
}
