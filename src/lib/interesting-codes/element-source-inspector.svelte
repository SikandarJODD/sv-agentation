<script lang="ts">
	import type { Snippet } from 'svelte';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import SquareArrowOutUpRightIcon from '@lucide/svelte/icons/square-arrow-out-up-right';
	import { resolveComponentName, resolveElementInfo, resolveSource } from 'element-source';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ButtonGroup, ButtonGroupSeparator } from '$lib/components/ui/button-group/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';

	interface HoverInfo {
		componentName: string | null;
		filePath: string;
		shortFileName: string;
		lineNumber: number | null;
		columnNumber: number | null;
		left: number;
		top: number;
		width: number;
		height: number;
		vscodeUrl: string | null;
		copyText: string;
		canVisit: boolean;
		canCopy: boolean;
	}

	let {
		children,
		selector = '.playground-container',
		enabled = true,
		showFullPath = true,
		vscodeScheme = 'vscode',
		workspaceRoot = null
	}: {
		children?: Snippet;
		selector?: string;
		enabled?: boolean;
		showFullPath?: boolean;
		vscodeScheme?: 'vscode' | 'vscode-insiders';
		workspaceRoot?: string | null;
	} = $props();

	let root: HTMLElement | null = null;
	let lastTarget: Element | null = null;
	let hoverInfo: HoverInfo | null = $state(null);

	const NO_SOURCE_VALUE = 'no-source-found';
	const WINDOWS_PATH_PATTERN = /^[A-Za-z]:[\\/]/;

	const shortenPath = (filePath: string) => filePath.split('/').slice(-1)[0] ?? filePath;

	const normalizeSlashes = (value: string) => value.replace(/\\/g, '/');

	const normalizeWorkspaceRoot = (value: string | null) => {
		if (!value) return null;
		return normalizeSlashes(value).replace(/\/+$/, '');
	};

	const resolveAbsoluteFilePath = (filePath: string, rootPath: string | null) => {
		const normalizedFilePath = normalizeSlashes(filePath);
		if (WINDOWS_PATH_PATTERN.test(filePath) || normalizedFilePath.startsWith('/')) {
			return normalizedFilePath;
		}

		const normalizedRoot = normalizeWorkspaceRoot(rootPath);
		if (!normalizedRoot) return null;

		return `${normalizedRoot}/${normalizedFilePath.replace(/^\.?\//, '')}`;
	};

	const buildCopyText = (
		componentName: string | null,
		shortFileName: string,
		filePath: string,
		lineNumber: number | null,
		columnNumber: number | null
	) => {
		const summary = `${componentName ?? 'Unknown'} | ${shortFileName}:${lineNumber ?? '?'}:${columnNumber ?? '?'}`;
		if (filePath === NO_SOURCE_VALUE) return summary;
		return `${summary}\n${filePath}`;
	};

	const buildVsCodeUrl = (
		filePath: string,
		lineNumber: number | null,
		columnNumber: number | null
	): string | null => {
		if (lineNumber === null || columnNumber === null) return null;

		const absoluteFilePath = resolveAbsoluteFilePath(filePath, workspaceRoot);
		if (!absoluteFilePath) return null;

		return `${vscodeScheme}://file/${encodeURI(absoluteFilePath)}:${lineNumber}:${columnNumber}`;
	};

	const buildHoverInfo = (
		target: Element,
		componentName: string | null,
		filePath: string,
		lineNumber: number | null,
		columnNumber: number | null
	): HoverInfo => {
		const rect = target.getBoundingClientRect();
		const shortFileName = filePath === NO_SOURCE_VALUE ? NO_SOURCE_VALUE : shortenPath(filePath);
		const copyText = buildCopyText(componentName, shortFileName, filePath, lineNumber, columnNumber);
		const vscodeUrl = filePath === NO_SOURCE_VALUE ? null : buildVsCodeUrl(filePath, lineNumber, columnNumber);

		return {
			componentName,
			filePath,
			shortFileName,
			lineNumber,
			columnNumber,
			left: rect.left,
			top: rect.top,
			width: rect.width,
			height: rect.height,
			vscodeUrl,
			copyText,
			canVisit: vscodeUrl !== null,
			canCopy: filePath !== NO_SOURCE_VALUE
		};
	};

	const clearHover = () => {
		lastTarget = null;
		hoverInfo = null;
	};

	const isTypingTarget = (target: EventTarget | null) => {
		if (!(target instanceof HTMLElement)) return false;
		const tagName = target.tagName.toLowerCase();
		if (target.isContentEditable) return true;
		return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
	};

	const handleMouseMove = async (event: MouseEvent) => {
		if (!enabled) return;

		const target = event.target;
		if (!(target instanceof Element)) return;
		if (target.closest('[data-inspector-ui]')) return;
		if (!root?.contains(target)) return;
		if (!target.closest(selector)) {
			clearHover();
			return;
		}
		if (target === lastTarget) return;

		lastTarget = target;

		const [componentName, source, elementInfo] = await Promise.all([
			resolveComponentName(target),
			resolveSource(target),
			resolveElementInfo(target)
		]);

		if (lastTarget !== target) return;

		const resolvedSource = source ?? elementInfo.source;
		hoverInfo = buildHoverInfo(
			target,
			componentName ?? elementInfo.componentName,
			resolvedSource?.filePath ?? NO_SOURCE_VALUE,
			resolvedSource?.lineNumber ?? null,
			resolvedSource?.columnNumber ?? null
		);
	};

	const copySourceDetails = async () => {
		if (!hoverInfo?.canCopy) {
			toast.error('No source details available to copy yet.');
			return;
		}

		try {
			await navigator.clipboard.writeText(hoverInfo.copyText);
			toast.success('Copied source details.');
		} catch {
			toast.error('Copy failed. Clipboard access was not available.');
		}
	};

	const visitSource = () => {
		if (!hoverInfo?.canVisit || !hoverInfo.vscodeUrl) {
			toast.error('VS Code link is unavailable for this element.');
			return;
		}

		toast.info('Opening source in VS Code...');
		window.location.href = hoverInfo.vscodeUrl;
	};

	const handleCopyClick = async (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		await copySourceDetails();
	};

	const handleVisitClick = (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		visitSource();
	};

	const handleKeyDown = async (event: KeyboardEvent) => {
		if (!enabled || !hoverInfo) return;
		if (event.defaultPrevented) return;
		if (event.metaKey || event.ctrlKey || event.altKey) return;
		if (isTypingTarget(event.target)) return;

		const key = event.key.toLowerCase();
		if (key === 'c') {
			event.preventDefault();
			await copySourceDetails();
			return;
		}

		if (key === 'o') {
			event.preventDefault();
			visitSource();
		}
	};
</script>

<svelte:window onkeydown={handleKeyDown} onscroll={clearHover} onresize={clearHover} />

<section
	bind:this={root}
	aria-label="Element source inspector"
	class="inspector-shell"
	onmousemove={handleMouseMove}
	onmouseleave={clearHover}
>
	{@render children?.()}

	<div
		class:hover-visible={hoverInfo !== null}
		class="hover-outline"
		data-inspector-ui
		style={`left:${hoverInfo?.left ?? 0}px;top:${hoverInfo?.top ?? 0}px;width:${hoverInfo?.width ?? 0}px;height:${hoverInfo?.height ?? 0}px;`}
	></div>

	<div
		class:hover-visible={hoverInfo !== null}
		class="hover-label"
		data-inspector-ui
		style={`left:${hoverInfo?.left ?? 0}px;top:${Math.max(8, (hoverInfo?.top ?? 0) - 38)}px;`}
	>
		<div class="hover-header">
			<div class="hover-text">
				<strong>{hoverInfo?.componentName ?? 'Unknown'}</strong>
				<span>
					{hoverInfo?.shortFileName ?? NO_SOURCE_VALUE}:{hoverInfo?.lineNumber ?? '?'}:{hoverInfo?.columnNumber ?? '?'}
				</span>
			</div>

			<ButtonGroup class="hover-actions-ui" data-inspector-ui>
				<Button
					aria-keyshortcuts="C"
					aria-label="Copy source details"
					class="inspector-button-ui"
					data-inspector-ui
					disabled={!hoverInfo?.canCopy}
					size="icon-sm"
					title="Copy source details (C)"
					variant="ghost"
					onclick={handleCopyClick}
				>
					<CopyIcon class="size-3.5" />
				</Button>
				<!-- <ButtonGroupSeparator data-inspector-ui /> -->
				<Button
					aria-keyshortcuts="O"
					aria-label="Open in VS Code"
					class="inspector-button-ui"
					data-inspector-ui
					disabled={!hoverInfo?.canVisit}
					size="icon-sm"
					title="Open in VS Code (O)"
					variant="ghost"
					onclick={handleVisitClick}
				>
					<SquareArrowOutUpRightIcon class="size-3.5" />
				</Button>
			</ButtonGroup>
		</div>

		{#if showFullPath}
			<Separator class="hover-separator-ui" data-inspector-ui />
			<div class="hover-meta" data-inspector-ui>{hoverInfo?.filePath ?? NO_SOURCE_VALUE}</div>
		{/if}
	</div>
</section>

<style>
	.inspector-shell {
		position: relative;
	}

	.hover-outline {
		position: fixed;
		z-index: 9998;
		border: 1px solid rgba(119, 168, 232, 0.72);
		background: rgba(104, 153, 216, 0.1);
		box-shadow: 0 0 0 1px rgba(119, 168, 232, 0.18) inset;
		pointer-events: none;
		box-sizing: border-box;
		opacity: 0;
		will-change: left, top, width, height, opacity;
		transition:
			left 180ms cubic-bezier(0.22, 1, 0.36, 1),
			top 180ms cubic-bezier(0.22, 1, 0.36, 1),
			width 180ms cubic-bezier(0.22, 1, 0.36, 1),
			height 180ms cubic-bezier(0.22, 1, 0.36, 1),
			opacity 140ms ease;
	}

	.hover-label {
		position: fixed;
		z-index: 9999;
		min-width: 14rem;
		max-width: min(34rem, calc(100vw - 16px));
		padding: 0.28rem 0.38rem;
		background: rgba(27, 58, 96, 0.98);
		color: #dcebff;
		border: 1px solid rgba(119, 168, 232, 0.3);
		box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
		opacity: 0;
		will-change: left, top, opacity;
		transition:
			left 180ms cubic-bezier(0.22, 1, 0.36, 1),
			top 180ms cubic-bezier(0.22, 1, 0.36, 1),
			opacity 140ms ease;
	}

	.hover-visible {
		opacity: 1;
	}

	.hover-header {
		display: flex;
		gap: 0.5rem;
		align-items: flex-start;
		justify-content: space-between;
	}

	.hover-text {
		display: grid;
		gap: 0.1rem;
		min-width: 0;
	}

	.hover-text strong {
		font-size: 0.9rem;
		font-weight: 700;
		line-height: 1.1;
	}

	.hover-text span {
		color: rgba(220, 235, 255, 0.95);
		font-size: 0.82rem;
		line-height: 1.15;
		word-break: break-word;
	}

	:global(.hover-actions-ui) {
		flex-shrink: 0;
		background: rgba(7, 18, 31, 0.28);
		border-radius: 0.4rem;
	}

	:global(.inspector-button-ui) {
		color: #dcebff;
		border-radius: 0.35rem;
	}

	:global(.inspector-button-ui:hover) {
		background: rgba(255, 255, 255, 0.12);
		color: white;
	}

	:global(.hover-separator-ui) {
		margin: 0.28rem 0;
		background: rgba(220, 235, 255, 0.22);
	}

	.hover-meta {
		color: rgba(220, 235, 255, 0.84);
		font-size: 0.76rem;
		line-height: 1.2;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (max-width: 640px) {
		.hover-label {
			max-width: calc(100vw - 16px);
		}

		.hover-header {
			gap: 0.35rem;
		}
	}
</style>
