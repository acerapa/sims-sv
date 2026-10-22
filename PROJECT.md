# Project: sims-sv

> This file is the source of truth for what this project is and how code here should be written.
> Agents: read this before writing any code in this repo. Keep it updated when the stack changes.
> (Adopted from existing codebase — every Conventions line below was observed in code.)

## Stack
- Language: TypeScript 5 (ESM, `"type": "module"`)
- Runtime: Node.js (adapter-node deployment)
- Package manager: npm/yarn (both `package-lock.json` and `yarn.lock` present — confirm which is canonical with the team)
- Project type: full-stack web app (retail/sales POS-style: customers, sales, invoices, POs, RMA, reports)
- Framework: SvelteKit 2 + Svelte 5 (`@sveltejs/kit ^2.43`, `svelte ^5.39`)
- Database: PostgreSQL via `postgres` (postgres-js) + Drizzle ORM (`drizzle-orm ^0.44`, dialect postgresql)

## Quality tooling
- Linter: ESLint 9 flat config — `eslint.config.js`; script: `npm run lint`
- Formatter: Prettier 3 (tabs, singleQuote, no trailing commas, 100 width, svelte + tailwindcss plugins) — `npm run format`
- Type check: svelte-check — `npm run check`
- Tests: Vitest 5 (unit, Node) — `npm test`; suites in `test/`; no E2E runner yet

## Conventions
- DB access is layered: schema in `src/lib/server/db/schema.ts`, single client in `src/lib/server/db/index.ts`, domain query modules under `src/lib/server/db/queries/` (one file per domain: `customers.ts`, `invoices.ts`, `rmas.ts`, …) — e.g. `src/lib/server/db/index.ts`
- Server logic lives in `+page.server.ts` load/actions; server-only code stays under `src/lib/server` — e.g. `src/routes/customers/daily-sales/print/[id]/+page.server.ts`
- Missing-resource errors use SvelteKit `error(404, '…')` in server code — e.g. `src/routes/customers/daily-sales/print/[id]/+page.server.ts:L9`
- Client-side failures surface via toast (`toast.error('…')`), not thrown into UI logic — e.g. `src/routes/customers/invoices/form/+page.svelte:L102`
- Environment via `$env/dynamic/private` with fail-fast throw when required var missing — e.g. `src/lib/server/db/index.ts:L12`
- UI built with bits-ui + Tailwind 4 (forms/typography plugins); icons from `@lucide/svelte`
- Shared values in `src/lib/constants`, `src/lib/stores` (Svelte 5 runes-era stores, e.g. `pageContext.ts`)

## Layout
- `src/routes/` — feature areas: `auth`, `customers` (clients, daily-sales, invoices, packages…), `reports`, `sales`, `settings`, `api`
- `src/lib/server/db/` — `schema.ts`, `index.ts` (client), `queries/` (domain modules), `seeders/`
- `src/lib/` — `components/`, `constants/`, `hooks/`, `stores/`, `types/`, `utils(+utils.ts)`
- `static/`, `drizzle/`-adjacent DB tooling, `ecosystem.config.cjs` (PM2), `ai-docs/`
