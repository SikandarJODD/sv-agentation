import type { ElementInfo } from 'element-source';

import type { InspectorHoverInfo, InspectorRuntimeOptions } from '../types';
import { buildVsCodeUrl } from './path';

export const NO_SOURCE_VALUE = 'no-source-found';

const VIEWPORT_GUTTER = 8;
const MAX_HOVER_CARD_WIDTH = 560;
const HOVER_CARD_OFFSET = 42;

export const shortenPath = (filePath: string) => filePath.split('/').slice(-1)[0] ?? filePath;

export const formatLocationLabel = (info: InspectorHoverInfo) =>
	`${info.shortFileName}:${info.lineNumber ?? '?'}:${info.columnNumber ?? '?'}`;

export const buildCopyText = (
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

const clampCardLeft = (left: number) => {
	if (typeof window === 'undefined') return Math.max(VIEWPORT_GUTTER, left);

	const estimatedWidth = Math.min(MAX_HOVER_CARD_WIDTH, window.innerWidth - VIEWPORT_GUTTER * 2);
	const maxLeft = Math.max(VIEWPORT_GUTTER, window.innerWidth - estimatedWidth - VIEWPORT_GUTTER);
	return Math.min(Math.max(VIEWPORT_GUTTER, left), maxLeft);
};

export const buildHoverInfo = (
	target: Element,
	elementInfo: ElementInfo,
	options: Pick<InspectorRuntimeOptions, 'workspaceRoot' | 'vscodeScheme'>
): InspectorHoverInfo => {
	const source = elementInfo.source;
	const rect = target.getBoundingClientRect();
	const filePath = source?.filePath ?? NO_SOURCE_VALUE;
	const shortFileName = filePath === NO_SOURCE_VALUE ? NO_SOURCE_VALUE : shortenPath(filePath);
	const copyText = buildCopyText(
		elementInfo.componentName,
		shortFileName,
		filePath,
		source?.lineNumber ?? null,
		source?.columnNumber ?? null
	);
	const vscodeUrl =
		filePath === NO_SOURCE_VALUE
			? null
			: buildVsCodeUrl(
					filePath,
					source?.lineNumber ?? null,
					source?.columnNumber ?? null,
					options.workspaceRoot,
					options.vscodeScheme
				);

	return {
		componentName: elementInfo.componentName,
		filePath,
		shortFileName,
		lineNumber: source?.lineNumber ?? null,
		columnNumber: source?.columnNumber ?? null,
		left: rect.left,
		top: rect.top,
		width: rect.width,
		height: rect.height,
		cardLeft: clampCardLeft(rect.left),
		cardTop: Math.max(VIEWPORT_GUTTER, rect.top - HOVER_CARD_OFFSET),
		copyText,
		vscodeUrl,
		canCopy: filePath !== NO_SOURCE_VALUE,
		canOpen: vscodeUrl !== null
	};
};
