# Print-headers logo — spec & tasks

**For:** the developer (or agent) picking up the printable-header logo work next.
**Ratified by user (2026-07):** Layout **A (letterhead)**; **keep the boxed company name**; live app chrome header is **out of scope** (deferred — may become its own task later).

## Overview

Every printable report header already renders the company identity in exactly two shared places:

1. **Browser-print path** — `src/lib/components/common/PrintReportLayout.svelte` → `.print-header` / `.company-info`: boxed "RAM TECH VENTURES INC." + 3 address lines. All 10 report/transfer print pages render through it.
2. **PDF path** — `src/lib/utils/pdf.ts` → `createReportDoc()`: draws the *same* header manually with jsPDF (text only). All 12 route `print/pdf.ts` builders call it.

This task adds the company logo — `static/ramtech-logo.jpg` (821×820 square, progressive JPEG, ~60KB, white background, no transparency) — to **both** headers, in a matching letterhead layout: logo left, name box + address to its right. Result: 2 core files + mechanical call-site updates; per-report drawers are untouched.

## Target design — Layout A (letterhead)

```
┌───────────────────────────────────────────────┐
│ ┌────┐   ┌──────────────────────────┐         │
│ │    │   │ RAM TECH VENTURES INC.   │  ← keep │
│ │LOGO│   └──────────────────────────┘    box  │
│ │    │   BARTOLOME BLDG. MAGSAYSAY ST.        │
│ └────┘   BRGY. EAST AWANG                   │
│         CALBAYOG, PA 6710                    │
├───────────────────────────────────────────────┤
│ REPORT TITLE                       date range │
└───────────────────────────────────────────────┘
```

- Logo **top-aligned** with the name box, text block to the right, vertically centered against the logo.
- HTML: `.print-header` becomes a `flex` row (`img` + existing `.company-info`), `gap: 12px`, `align-items: center`.
- PDF: name box + address lines shift right by `LOGO_SIZE + LOGO_GAP`; logo drawn at the same top edge as the name box rect.

### Canonical sizing (D2)

| Surface | Value | Notes |
|---|---|---|
| HTML `img` | `height: 64px; width: auto` | square asset → 64×64 |
| PDF `addImage` | `48 × 48 pt` at `(margin, 32)` | 64px × 0.75 = 48pt — identical physical size on paper |
| Gap | `12px` / `12pt` | logo → text block |

The title section, rules, and `startY` (148pt) are **unchanged** — only the company-info x-origin moves.

## Decisions

- **D1 — Layout & name box (ratified).** Layout A; keep the 2px box around the company name in both surfaces.
- **D2 — Sizing (above).** Single source of truth: 64px ≡ 48pt, gap 12. Named constants (`LOGO_SIZE`, `LOGO_GAP` in `pdf.ts`; CSS custom values in the component) so future tweaks are one-liners on each side.
- **D3 — Page-1 only (parity, RATIFIED).** The company header appears on page 1 only in both paths today (table *column* headers repeat; the company block does not — see `print-migration-tasks.md` and the `.print-table thead` rule). The logo follows the company block. No behavior change.
- **D4 — `createReportDoc` becomes async + self-loading in browser, injected in Node.** `pdf.ts` must remain runnable from plain Node (its doc comment, and the ~11 test specs in `test/`). Design:
  ```ts
  // pdf.ts — new/changed signatures
  export interface ReportOptions { title: string; subtitle??: string; orientation?; logoBase64?: string }
  export async function createReportDoc(options: ReportOptions): Promise<ReportDoc>
  ```
  `createReportDoc` resolves the logo: `options.logoBase64 ?? (typeof window !== 'undefined' ? await loadLogoBase64() : undefined)`, where `loadLogoBase64()` (new, in `pdf.ts`, `typeof window`-guarded, no `$lib` imports) fetches `/ramtech-logo.jpg` → base64 string.
  **Graceful degradation (RATIFIED):** if the fetch fails or `addImage` throws, log and fall back to the current logo-less header — a 60KB static asset must never break PDF generation.
- **D5 — Asset & format.** Use `/ramtech-logo.jpg` as-is. `<img>` is preferred over a CSS background: images print even when the user has "Background graphics" switched off, and jsPDF reads JPEG natively (no conversion, no new dependency). No new file in `static/`; the app already serves it (favicon pattern proves root deployment).
- **D6 — App chrome header.** `src/lib/components/layout/Header.svelte` is **not** touched in this task (user-deferred).

## Call-site impact

| Call site | Change |
|---|---|
| 12 × route `print/pdf.ts` | `createReportDoc(...)` → `await createReportDoc(...)`; `buildXxxPdf` becomes `async` (returns `Promise<jsPDF>`) |
| 12 × print `+page.svelte` `onPrint` handlers | `openAndPrint(buildXxxPdf(...))` → `openAndPrint(await buildXxxPdf(...));` (handlers may be `async`) |
| 11 × `test/*-printable.spec.ts` | `buildXxxPdf(...)` → `await buildXxxPdf(...)` where called synchronously |

No builder gains a logo argument — `createReportDoc` self-loads (D4), so **no route `pdf.ts` passes logo data explicitly** except tests that inject a fixture.

## Tasks

Each code task ends with the house gate: `npm run check` && `npm run lint` clean.

- **T1 — HTML letterhead.** `PrintReportLayout.svelte`: add `<img src="/ramtech-logo.jpg" alt="RAM Tech Ventures Inc. logo" class="company-logo">`; make `.print-header` flex; keep `.company-info` unchanged apart from layout; `@media print` keeps the img visible and crisp (`print-color-adjust: exact` belt-and-braces).
  Files: `src/lib/components/common/PrintReportLayout.svelte`.
- **T2 — PDF header logo.** `pdf.ts`: `LOGO_SIZE`/`LOGO_GAP` constants; async `createReportDoc`; draw logo when present and shift name-box/address x-origin by `LOGO_SIZE + LOGO_GAP` (name-box `rect` left edge, its text, and the 3 address lines all move together); try/catch fallback per D4.
  Files: `src/lib/utils/pdf.ts`.
- **T3 — Await sweep.** Make the 12 builders async; await in the 12 print pages' handlers. Grep-sweep: `grep -rn "createReportDoc(" src` shows only awaited call sites (plus the definition).
  Files: the 12 route `pdf.ts` + 12 print `+page.svelte` (list in `pdf-shared-helpers-spec.md` "Files in scope").
- **T4 — Tests.**
  - Existing 11 printable specs: unblock with `await` (no weakening).
  - New: Node spec — `createReportDoc({ title, logoBase64: <tiny fixture JPEG> })` → assert `doc.getFiles()`/images include the embedded logo, and that name box x-origin shifts by `LOGO_SIZE + LOGO_GAP`.
  - New: degradation — `loadLogoBase64` failure path returns `undefined` and `createReportDoc` still resolves with the current header geometry (mock `globalThis.fetch` rejection in browser-guarded test, or unit-test the guard directly).
  - New: Svelte/DOM assertion that `PrintReportLayout` renders `img[src="/ramtech-logo.jpg"]` (follow whatever DOM-testing pattern the suite already uses; if none exists, use jsdom + `render` from `svelte`).
  Files: `test/*`.
- **T5 — Smoke.** Generate one real PDF (e.g. `vendors/categories` — smallest builder) via the existing `.tmp-pdf-test` flow *in a browser context* so the fetch path executes; open the blob and verify: logo visible top-left, name box intact, text not clipped at the right margin, page 2 (if any) has no logo. Also open one print page and hit the Print preview.
- **T6 — Review gate.** code-review on the full diff; expected: zero behavior change beyond the logo appearing on page 1 of every printable.

## Risks / pitfalls

- **jsPDF + progressive JPEG.** The asset is a *progressive* JPEG. jsPDF generally handles it, but this is the one unverified tech pairing in the plan — T5's smoke test exists specifically to catch it. Fallback if it garbles: re-encode the asset to baseline JPEG (or PNG with white bg) into `static/`; no code change in D5's shape.
- **Async ripple.** 24 route-side call sites + 11 specs change `buildXxxPdf` from sync to async. The `check`/`lint`/test gates catch every miss, but expect T3 to be a two-sided sweep (route + spec).
- **"Background graphics" off.** Solved by design: `<img>` in HTML, native `addImage` in PDF — neither depends on background printing (D5). White JPEG background on white paper: fine.
- **Asset path assumption.** `/ramtech-logo.jpg` assumes the app is served at the root (already true for `/favicon.svg`, `/robots.txt`). If a future sub-base deployment happens, it'd need `$app/environment` `base` — out of scope, note only.

## Related

- `ai-docs/pdf-shared-helpers-spec.md` — the shared-helper consolidation this spec builds on (same files, same Node-runnability constraint)
- `ai-docs/*-printable-spec.md` — per-report printable specs (headers stay within their contracts; only the shared company block changes)
- `static/ramtech-logo.jpg` — the asset (821×820, ~60KB, progressive JPEG, white bg)
