// Runtime stand-in for the `$env/static/private` virtual module, which only exists under
// SvelteKit's Vite pipeline (dev server/build). Standalone scripts (seeders) run via tsx,
// which can't see the virtual module — tsconfig.scripts.json maps the specifier here
// instead. Values come from process.env, populated from .env by the npm scripts'
// --import dotenv/config.
export const DATABASE_URL = process.env.DATABASE_URL;
