import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
	viteConfig,
	defineConfig({
		resolve: {
			conditions: ['browser']
		},
		test: {
			environment: 'jsdom',
			globals: true,
			include: ['tests/**/*.test.ts']
		}
	})
);
