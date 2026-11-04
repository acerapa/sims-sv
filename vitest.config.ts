import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
			'$app/forms': fileURLToPath(new URL('./test/shims/app-forms.js', import.meta.url))
		}
	},
	test: {
		environment: 'node',
		include: ['test/**/*.spec.ts']
	}
});
