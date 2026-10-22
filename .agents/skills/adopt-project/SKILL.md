---
name: adopt-project
description: Profile an EXISTING codebase (no scaffolding, no overwrites) and draft a PROJECT.md contract — stack, quality tooling, conventions, layout — derived from evidence in the code, for the user to approve. Use when joining an unfamiliar repo, when a project has no PROJECT.md, or when the user asks to "pick up", "profile", or "adopt" an existing project.
---

# Adopt Project

You join an existing codebase and produce its agent contract, `PROJECT.md`. You are the mirror image of `init-project`: it *decides* a stack and scaffolds; you **infer** a stack from evidence and never create, modify, or delete any project file except writing the approved `PROJECT.md` at the repo root.

Core law: **every claim must cite evidence** (a file, a config entry, a script name). "I assume it uses X" is forbidden in the final document. If evidence is absent or ambiguous, mark the field `unknown (<what to check>)` and ask the user — an honest unknown beats a confident guess.

## Workflow

### 1. Establish ground truth (read-only)

- Root files: lockfiles + manifests (`package.json` + lockfile, `pyproject.toml`, `go.mod`, `Cargo.toml`…), version pin files (`.nvmrc`, `.tool-versions`, `engines`, `requires-python`), `README`.
- Tooling configs and their scripts: linter/formatter/type-checker configs and the exact npm/package scripts that run them (e.g. `"lint"`, `"check"`).
- Test reality: test script(s), test framework deps, test directories, E2E runner config (Playwright/Cypress), CI test steps if a `.github/` exists. **If there is no test framework, say so plainly — do not name one the user hasn't chosen.**
- Data layer: DB driver + ORM deps, schema/migrations locations, how env/config is sourced (`.env*` handling, config loaders).
- Layout: one line per top-level directory + key subdirectories (`src/lib`, `app/api/…`), each with an observed role. Base roles on what's actually inside; when two plausible roles exist, ask.

### 2. Mine conventions from code (evidence, not ideology)

Open 3–5 **representative, recently relevant** files near where future work will happen (prefer the feature area the user named). Extract observable conventions and record a representative example for each, e.g.:

- Import style (ESM/CJS, relative vs package, ordering habit)
- Component/function structure, state approach (e.g. runes vs stores vs context)
- Server vs client boundary: where logic lives (load functions, server endpoints, hooks?)
- DB access pattern (layered? in handlers? via a client module? raw SQL or ORM?)
- Error handling + response envelope (what does a handler return on failure?)
- Naming + file-naming conventions (`+page.svelte`, kebab vs camel, `stores/` naming)
- Formatting: quote style, indentation (tabs/spaces), trailing commas, line width — **from the formatter config, not from taste**
- Types: `any` tolerance, shared types location, schema/validator usage and where schemas live
- Auth/permissions boundary if present
- i18n / styling system (e.g. CSS framework + plugins, icon lib)

For each: *one line rule + one pointer* (`e.g. src/routes/sales/+page.server.ts:L..`). If the codebase is inconsistent, state the **dominant pattern with percentage feel** and mark the minority explicitly — the contract says "follow the dominant, don't invent a third".

### 3. Draft `PROJECT.md` (same shape as init-project's)

Identical sections and keys as the `init-project` format so all consumers stay stable:

```markdown
# Project: <name>

> This file is the source of truth for what this project is and how code here should be written.
> Agents: read this before writing any code in this repo. Keep it updated when the stack changes.
> (Adopted from existing codebase — every Conventions line below was observed in code.)

## Stack
- Language: …
- Runtime: …
- Package manager: …   (infer from lockfile present: package-lock.json/yarn.lock/pnpm-lock.yaml)
- Project type: …
- Framework: …
- Database: …

## Quality tooling
- Linter: name + config file + exact script
- Formatter: name + config file + exact script
- Type check: name + exact script (or "none")
- Tests: framework + location + exact script  (or "none yet — no test framework in package.json")

## Conventions
- <observed rule> — e.g. <file:line>
(3–10 lines; dominant patterns only; each with its evidence pointer)

## Layout
- <dir> — <observed role>
```

### 4. Present for approval — do not write yet

Show the draft to the user with: the 3–5 highest-impact inferred conventions, anything marked `unknown`, and any inconsistencies found. Ask: "approve as-is, or correct anything?"

On approval: write the file to the repo root. If a `PROJECT.md` **already exists**: don't clobber — diff your findings against it, report lines that have gone stale vs. code, and ask which wins before touching it.

### 5. Report

- What was adopted (stack + tooling, one line each)
- Conventions captured (n lines) and the files that anchored them
- Unknowns the user must resolve
- Note: `clean-code`, `tester`, and `code-review` now have their binding contract for this repo.

## Boundaries

- **Read-only** with respect to the codebase. The only file you may create/update is `PROJECT.md` at the root, and only after approval.
- Never add tooling, never install, never suggest edits as part of adoption — observations in the report may mention gaps ("no test framework", "no type-check script"), stated as facts for the user to decide, not as to-dos you will do.
- Inferences about *intent* (why a pattern exists) stay in the report conversation; only *observable, stable* rules go into the Conventions section.
- Keep the document short: a contract, not documentation. If a rule needs more than one line, it's not a contract line — cut it.
