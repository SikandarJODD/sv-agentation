import { beforeEach, describe, expect, it } from 'vitest';

import {
	buildDomPath,
	buildElementSelectorPath,
	buildFullDomPath,
	getDeepEventTarget,
	resolveDomPath
} from '../src/lib/utils/dom';

describe('dom path utilities', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});

	it('round-trips a light-DOM element through build/resolve', () => {
		document.body.innerHTML =
			'<main><section></section><section><p id="target"></p></section></main>';
		const target = document.getElementById('target')!;

		const path = buildDomPath(target);
		expect(path).not.toBeNull();
		expect(resolveDomPath(path as string)).toBe(target);
	});

	it('round-trips an element nested inside an open shadow root', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const shadow = host.attachShadow({ mode: 'open' });
		shadow.innerHTML = '<span></span><button id="inner">Annotate me</button>';
		const inner = shadow.getElementById('inner')!;

		const path = buildDomPath(inner);
		expect(path).not.toBeNull();
		// The boundary crossing is encoded so it can be replayed.
		expect(path).toContain('s');
		expect(resolveDomPath(path as string)).toBe(inner);
	});

	it('round-trips an element nested two shadow levels deep', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const outer = host.attachShadow({ mode: 'open' });
		const innerHost = document.createElement('div');
		outer.appendChild(innerHost);
		const inner = innerHost.attachShadow({ mode: 'open' });
		inner.innerHTML = '<p id="deep">deep</p>';
		const deep = inner.getElementById('deep')!;

		const path = buildDomPath(deep);
		expect(path).not.toBeNull();
		expect(resolveDomPath(path as string)).toBe(deep);
	});

	it('stays backward compatible with legacy numeric-only paths', () => {
		document.body.innerHTML = '<main><p id="target"></p></main>';
		const target = document.getElementById('target')!;
		// Legacy paths were plain child indices joined by "/".
		expect(resolveDomPath('0/0')).toBe(target);
	});

	it('prefers the composed-path target over a retargeted event target', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const shadow = host.attachShadow({ mode: 'open' });
		shadow.innerHTML = '<button id="inner">Click</button>';
		const inner = shadow.getElementById('inner')!;

		const event = {
			target: host,
			composedPath: () => [inner, shadow, host, document.body, document]
		} as unknown as Event;

		expect(getDeepEventTarget(event)).toBe(inner);
	});

	it('falls back to event.target when no composed path is available', () => {
		document.body.innerHTML = '<button id="plain">Click</button>';
		const plain = document.getElementById('plain')!;
		const event = { target: plain, composedPath: () => [] } as unknown as Event;

		expect(getDeepEventTarget(event)).toBe(plain);
	});

	it('builds a selector path that crosses the shadow boundary into the host', () => {
		const host = document.createElement('my-widget');
		host.className = 'widget';
		document.body.appendChild(host);
		const shadow = host.attachShadow({ mode: 'open' });
		shadow.innerHTML = '<div class="card"><button class="cta">Annotate</button></div>';
		const cta = shadow.querySelector('.cta')!;

		// The host must appear in the chain — the shadow element is not a root.
		expect(buildElementSelectorPath(cta)).toBe('my-widget.widget > div.card > button.cta');
		expect(buildFullDomPath(cta)).toContain('my-widget.widget > div.card > button.cta');
	});
});
