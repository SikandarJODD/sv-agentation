import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
	buildAreaSelectionAnchor,
	resolveAreaSelection,
	resolveTextSelection,
	serializeTextSelection
} from '../src/lib/utils/selection';

const setViewport = (width: number, height: number) => {
	Object.defineProperty(window, 'innerWidth', {
		configurable: true,
		value: width
	});
	Object.defineProperty(window, 'innerHeight', {
		configurable: true,
		value: height
	});
};

describe('selection helpers', () => {
	beforeEach(() => {
		setViewport(1280, 720);
		document.body.innerHTML = '<main><p id="copy">Hello brave new world</p></main>';
		Object.defineProperty(Range.prototype, 'getClientRects', {
			configurable: true,
			value: () => [{ left: 10, top: 20, width: 100, height: 20 } as DOMRect]
		});
		window.scrollTo = vi.fn();
	});

	it('recovers a text selection when whitespace changes', () => {
		const textNode = document.querySelector('#copy')?.firstChild;
		if (!(textNode instanceof Text)) {
			throw new Error('expected text node');
		}

		const selection = window.getSelection();
		const range = document.createRange();
		range.setStart(textNode, 6);
		range.setEnd(textNode, 15);
		selection?.removeAllRanges();
		selection?.addRange(range);

		const serialized = serializeTextSelection(selection!);
		expect(serialized).not.toBeNull();

		document.querySelector('#copy')!.textContent = 'Hello brave\nnew world';
		const resolved = resolveTextSelection(serialized!.anchor);
		expect(resolved).not.toBeNull();
		expect(resolved?.range.toString()).toContain('brave');
	});

	it('keeps area anchors stable across scroll', () => {
		const anchor = buildAreaSelectionAnchor(
			{
				left: 40,
				top: 80,
				width: 120,
				height: 60
			},
			160,
			140
		);

		const resolved = resolveAreaSelection(anchor);
		expect(resolved.bounds.left).toBe(40);
		expect(resolved.markerLeft).toBe(160);
	});
});
