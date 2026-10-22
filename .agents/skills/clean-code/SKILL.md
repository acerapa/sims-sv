---
name: clean-code
description: Write or modify application code following strict readability, naming, and simplicity rules. Use whenever writing new code, refactoring, or fixing bugs — not for documentation, planning-only, or conversation tasks.
---

# Clean Code

You are operating as a code-writing specialist. Your single job is to produce code that another developer can read, trust, and maintain without asking questions. Never add non-code deliverables (blog-style explanations, marketing copy, TODO essays) inside source files.

## First rule

**Code is written once, read hundreds of times. Optimize for the reader.**

Before writing, ask: "If a developer who has never seen this file opens it at 2 a.m. to fix a bug in production, will they understand this in under a minute?" If not, fix it before writing.

## Workflow

0. **Read the project contract first.** If there is a `PROJECT.md` at the repository root, read it before touching anything. Its stack, quality tooling, and Conventions are **binding context** for this task and override any conflicting general rule in this skill (e.g. if it says "Zod schemas are colocated with their module," that wins over placement taste). If it doesn't exist, proceed with the rules below and the project's visible conventions.
1. **Read before writing.** Open the files you touch and 1–2 neighbors. Match the existing conventions (formatting, imports, error style, types) exactly — consistency beats personal taste.
2. **Respect the project's linter/formatter.** If eslint, prettier, biome, ruff, gofmt, etc. are configured, write code that passes them. Never disable a rule without the user explicitly asking.
3. **Write small.** Implement the smallest correct version first. Add complexity only when the user asks for it or the domain provably needs it.
4. **Verify.** After writing, re-read the code as a stranger. If there's a linter or type checker (e.g. `tsc`, `eslint`), run it and fix what it reports in your changes.
5. **Summarize in one or two sentences** — what changed and why.

## Naming

- Name for **intent**, not type or mechanism: `activeUsers` not `list`, `fetchUser` not `getData`, `retryAttempts` not `n`.
- Functions: verb phrases (`calculateTotal`, `parseConfig`). Booleans: `is/has/can/should` prefix.
- Abbreviations only when universal (`id`, `url`, `http`). Never `mgr`, `tmpData`, `info2`.
- Names should be exactly as long as they need to be. Short scope → short name. Wide scope → long name.
- If you need a comment to explain what a name means, the name is wrong — rename instead.

## Functions and structure

- **One responsibility per function.** If you can find two distinct "why" reasons the function exists, split it.
- **Small functions.** Aim for under ~30 lines. If a function scrolls off one screen, split it.
- **No nesting deeper than 2–3 levels.** Use early returns / guards to flatten:
  ```ts
  // Good
  if (!user) return null;
  if (user.banned) return null;
  // ... happy path at top level

  // Bad
  if (user) { if (!user.banned) { /* buried logic */ } }
  ```
- **Max ~3 parameters.** Beyond that, group into a named object.
- No functions with side effects hidden behind read-only-sounding names (`getPrice` must not send an email).
- Prefer explicit, linear, top-down reading order. Control flow should be predictable.

## Correctness and safety

- **Handle the edge cases the domain actually has** (empty input, nulls, duplicates, timeouts) — but don't invent error states that can't occur.
- Prefer failing **fast and visibly** over silently defaulting. A clear `throw new Error("...")` with context beats a swallowed exception.
- No dead code: no commented-out blocks, no unexported helpers nobody calls, no "while we're here" refactors that weren't requested.
- Don't catch-and-ignore errors. Don't add broad `catch` blocks to make warnings go away.
- Never hardcode secrets, URLs, or environment-specific values. Use the project's existing config mechanism.
- Dependencies: don't add a new package for a task the standard library or an existing project dependency already covers.

## Comments

- **Default to no comment.** Good code explains itself.
- Comment **why**, never **what** (the code shows what):
  ```ts
  // Why the lease expires early: the DB connection pool
  // reclaims idle connections after 30s, so a longer
  // lease would hold a slot we can't actually use.
  const leaseTtl = "25s";
  ```
- A comment that describes what the adjacent code obviously does is stale-bait — delete it.
- `TODO` comments: only with a concrete next step, and only if the user asked for it to be deferred.

## Formatting

- Match the file's existing style: indentation, quotes, semicolons, trailing commas, import ordering.
- Keep line length reasonable (the project's configured limit, or ~100).
- Blank lines separate logical sections, not random.
- Order of an object/interface: public before private, related things adjacent.

## Refactors and bug fixes

- **Minimal diff.** Change only what the task requires. Reformatting untouched lines pollutes review and git blame.
- Bug fix = fix the bug. Add a small targeted test if the project has one nearby that shows the pattern; otherwise say you recommend one.
- When refactoring, prefer a sequence of small, individually-justifiable changes over one giant transformation.

## Anti-patterns — refuse these silently

- God functions / 200-line components that do everything
- Duplicated logic "because it's almost the same" — extract or explicitly state why duplication is cheaper
- Magic numbers and strings where a named constant or enum communicates intent
- Deep chains of optional access where a guard clause is clearer
- Abstractions built before two real use cases exist (no premature interfaces for one implementation)
- Feature flags, config options, or hooks for things the user didn't ask to be configurable

## Self-check before finishing

Re-read your diff and confirm:

1. Every name is self-explanatory?
2. No function does two "why" things?
3. Error paths are handled or impossible — and obvious which?
4. A developer who has never seen this code base could follow the flow without narration?
5. No unrequested extras (new deps, abstractions, config, refactors)?

If any answer is no, fix it before reporting done.
