import type { InspectorHoverInfo, InspectorNote, NoteSourceInfo } from '../types';
import { getElementTextPreview, getTagLabel, resolveDomPath } from './dom';
import { NO_SOURCE_VALUE } from './shared/constants';

export const truncateText = (value: string, maxLength = 40) => {
	if (value.length <= maxLength) return value;
	return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
};

const collapseWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

export const buildSourceInfoFromHoverInfo = (hoverInfo: InspectorHoverInfo): NoteSourceInfo => ({
	componentName: hoverInfo.componentName,
	tagName: hoverInfo.tagName,
	filePath: hoverInfo.filePath,
	shortFileName: hoverInfo.shortFileName,
	lineNumber: hoverInfo.lineNumber,
	columnNumber: hoverInfo.columnNumber
});

export const createEmptySourceInfo = (tagName = 'area'): NoteSourceInfo => ({
	componentName: null,
	tagName,
	filePath: NO_SOURCE_VALUE,
	shortFileName: NO_SOURCE_VALUE,
	lineNumber: null,
	columnNumber: null
});

export const buildElementTargetSummary = (target: Element) => {
	const label = getTagLabel(target.tagName);
	const textPreview = truncateText(getElementTextPreview(target), 34);

	if (!textPreview) {
		return label;
	}

	return `${label}: "${textPreview}"`;
};

export const buildElementTargetLabel = (target: Element) => {
	const label = getTagLabel(target.tagName);
	const textPreview = truncateText(getElementTextPreview(target), 82);

	if (!textPreview) {
		return label;
	}

	return `${label}: "${textPreview}"`;
};

const buildNamedSelectionList = (targets: Element[]) =>
	targets
		.slice(0, 3)
		.map((target) => buildElementTargetLabel(target))
		.join(', ');

export const buildGroupTargetSummary = (targets: Element[]) => {
	if (targets.length === 0) return 'Selected elements';
	if (targets.length === 1) return buildElementTargetSummary(targets[0]);

	const suffix = targets.length > 3 ? ` +${targets.length - 3} more` : '';
	return `${targets.length} elements: ${buildNamedSelectionList(targets)}${suffix}`;
};

export const buildGroupTargetLabel = (targets: Element[]) => {
	if (targets.length === 0) return 'Selected elements';
	if (targets.length === 1) return buildElementTargetLabel(targets[0]);

	const suffix = targets.length > 3 ? ` +${targets.length - 3} more` : '';
	return `${targets.length} elements: ${buildNamedSelectionList(targets)}${suffix}`;
};

export const buildAreaTargetSummary = () => 'Area selection';
export const buildAreaTargetLabel = (box: { width: number; height: number }) =>
	`Area selection (${Math.round(box.width)} x ${Math.round(box.height)})`;

export const buildTextTargetSummary = (target: Element, selectedText: string) => {
	const base = buildElementTargetSummary(target);
	const preview = truncateText(collapseWhitespace(selectedText), 48);
	return preview ? `${base} -> "${preview}"` : base;
};

export const buildTextTargetLabel = (target: Element) => buildElementTargetLabel(target);

export const getComposerPlaceholder = (kind: InspectorNote['kind'], elementCount = 1) => {
	if (kind === 'group' && elementCount > 1) {
		return 'Feedback for this group of elements...';
	}

	return 'What should change ?';
};

export const formatLocation = (note: InspectorNote) => {
	if (!note.shortFileName || note.shortFileName === NO_SOURCE_VALUE) return 'Source unavailable';
	if (note.lineNumber === null || note.columnNumber === null) return note.shortFileName;

	return `${note.shortFileName}:${note.lineNumber}:${note.columnNumber}`;
};

const buildElementLocationPath = (target: Element | null, fallback: string) => {
	if (!target) return fallback;

	const segments: string[] = [];
	let current: Element | null = target;

	while (current && current !== document.body) {
		segments.unshift(current.tagName.toLowerCase());
		current = current.parentElement;
	}

	return segments.slice(-4).join(' > ') || fallback;
};

const getNoteLocationLabel = (note: InspectorNote) => {
	switch (note.kind) {
		case 'element':
			return buildElementLocationPath(resolveDomPath(note.anchor.domPath), note.tagName);
		case 'text':
			return buildElementLocationPath(resolveDomPath(note.anchor.commonAncestorPath), note.tagName);
		case 'group': {
			const paths = note.anchor.selectedDomPaths
				.map((path) => buildElementLocationPath(resolveDomPath(path), note.tagName))
				.slice(0, 3);
			return paths.join(' | ') || 'group selection';
		}
		case 'area':
			return `area (${Math.round(note.anchor.bounds.width)} x ${Math.round(note.anchor.bounds.height)})`;
	}
};

export const formatNotesAsMarkdown = (notes: InspectorNote[]) => {
	if (notes.length === 0) {
		return 'Page Feedback\n\nNo feedback added yet.';
	}

	return [
		'Page Feedback',
		'',
		...notes.flatMap((note, index) => {
			const lines = [
				`${index + 1}. ${note.targetSummary}`,
				`Location: ${getNoteLocationLabel(note)}`,
				`Feedback: ${note.note}`,
				`Source: ${formatLocation(note)}`
			];

			if (note.kind === 'text') {
				lines.splice(2, 0, `Selected text: "${collapseWhitespace(note.anchor.selectedText)}"`);
			}

			if (index < notes.length - 1) {
				lines.push('', '---', '');
			}

			return lines;
		})
	].join('\n');
};
