import type { VsCodeScheme } from '../types';

const WINDOWS_PATH_PATTERN = /^[A-Za-z]:[\\/]/;

export const normalizeSlashes = (value: string) => value.replace(/\\/g, '/');

export const normalizeWorkspaceRoot = (value: string | null) => {
	if (!value) return null;
	return normalizeSlashes(value).replace(/\/+$/, '');
};

export const resolveAbsoluteFilePath = (filePath: string, workspaceRoot: string | null) => {
	const normalizedFilePath = normalizeSlashes(filePath);
	if (WINDOWS_PATH_PATTERN.test(filePath) || normalizedFilePath.startsWith('/')) {
		return normalizedFilePath;
	}

	const normalizedRoot = normalizeWorkspaceRoot(workspaceRoot);
	if (!normalizedRoot) return null;

	return `${normalizedRoot}/${normalizedFilePath.replace(/^\.?\//, '')}`;
};

export const buildVsCodeUrl = (
	filePath: string,
	lineNumber: number | null,
	columnNumber: number | null,
	workspaceRoot: string | null,
	vscodeScheme: VsCodeScheme
) => {
	if (lineNumber === null || columnNumber === null) return null;

	const absoluteFilePath = resolveAbsoluteFilePath(filePath, workspaceRoot);
	if (!absoluteFilePath) return null;

	return `${vscodeScheme}://file/${encodeURI(absoluteFilePath)}:${lineNumber}:${columnNumber}`;
};
