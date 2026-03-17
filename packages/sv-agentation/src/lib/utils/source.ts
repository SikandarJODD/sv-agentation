import type { ElementInfo } from 'element-source';

import type { InspectorHoverInfo, InspectorRuntimeOptions } from '../types';
import { clampNumber, getElementTextPreview, getTagLabel } from './dom';
import { buildVsCodeUrl } from './path';
import { NO_SOURCE_VALUE } from './shared/constants';

const VIEWPORT_GUTTER = 8;
const MAX_HOVER_CARD_WIDTH = 312;
const HOVER_CARD_HEIGHT = 38;
const HOVER_CARD_OFFSET_X = 10;
const HOVER_CARD_OFFSET_Y = 34;

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

const truncateText = (value: string, maxLength = 52) => {
	if (value.length <= maxLength) return value;
	return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
};

const buildHoverTargetLabel = (target: Element) => {
	const label = getTagLabel(target.tagName);
	const textPreview = truncateText(getElementTextPreview(target));

	if (!textPreview) {
		return label;
	}

	return `${label}: "${textPreview}"`;
};

const clampCardLeft = (left: number) => {
	if (typeof window === 'undefined') return Math.max(VIEWPORT_GUTTER, left);

	const estimatedWidth = Math.min(MAX_HOVER_CARD_WIDTH, window.innerWidth - VIEWPORT_GUTTER * 2);
	const maxLeft = Math.max(VIEWPORT_GUTTER, window.innerWidth - estimatedWidth - VIEWPORT_GUTTER);
	return Math.min(Math.max(VIEWPORT_GUTTER, left), maxLeft);
};

const clampCardTop = (top: number) => {
	if (typeof window === 'undefined') return Math.max(VIEWPORT_GUTTER, top);

	const maxTop = Math.max(
		VIEWPORT_GUTTER,
		window.innerHeight - HOVER_CARD_HEIGHT - VIEWPORT_GUTTER
	);
	return clampNumber(top, VIEWPORT_GUTTER, maxTop);
};

export const getHoverGeometry = (target: Element, clientX: number, clientY: number) => {
	const rect = target.getBoundingClientRect();

	return {
		left: rect.left,
		top: rect.top,
		width: rect.width,
		height: rect.height,
		cardLeft: clampCardLeft(clientX + HOVER_CARD_OFFSET_X),
		cardTop: clampCardTop(clientY - HOVER_CARD_OFFSET_Y)
	};
};

export const buildHoverInfo = (
	target: Element,
	elementInfo: ElementInfo,
	clientX: number,
	clientY: number,
	options: Pick<InspectorRuntimeOptions, 'workspaceRoot' | 'vscodeScheme'>
): InspectorHoverInfo => {
	const source = elementInfo.source;
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
	const geometry = getHoverGeometry(target, clientX, clientY);

	return {
		componentName: elementInfo.componentName,
		tagName: target.tagName.toLowerCase(),
		targetLabel: buildHoverTargetLabel(target),
		filePath,
		shortFileName,
		lineNumber: source?.lineNumber ?? null,
		columnNumber: source?.columnNumber ?? null,
		...geometry,
		copyText,
		vscodeUrl,
		canCopy: filePath !== NO_SOURCE_VALUE,
		canOpen: vscodeUrl !== null
	};
};
