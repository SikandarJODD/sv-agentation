import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const toFsPath = (url: URL) => decodeURIComponent(url.pathname).replace(/^\/([A-Za-z]:)/, '$1');
const repoRoot = toFsPath(new URL('../..', import.meta.url));
const agentationSourceEntry = toFsPath(
	new URL('../../packages/sv-agentation/src/lib/index.ts', import.meta.url)
);

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	resolve: {
		alias: {
			'sv-agentation': agentationSourceEntry
		}
	},
	server: {
		fs: {
			allow: [repoRoot]
		}
	}
});
