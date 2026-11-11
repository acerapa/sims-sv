import { defineEnvVars } from '@sveltejs/kit/env';

// @migration-task Review usage of dynamic environment variables. They fall back to the empty string if not present, which may not be what you want.
export const variables = defineEnvVars({
	NODE_ENV: { schema: (input) => input ?? '' },
	DATABASE_URL: { schema: (input) => input ?? '' }
});
