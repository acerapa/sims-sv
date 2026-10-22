# jsPDF print migration — master task board

**For:** the developer (or agent) working through the print rework queue; the user tracking progress.
**Scope:** all print routes still on the legacy `window.print()` / browser-HTML pipeline.
**Goal:** migrate every remaining print trigger to the jsPDF pipeline (`pdf.ts` builder + `openAndPrint`), route by route, each spec'd, tested, and reviewed as its own unit of work.

## Where we are

Two routes are **done** and are the pattern to copy (pipeline only — layouts differ per route):

| Route | Builder | Format | Spec |
|---|---|---|---|
| `src/routes/vendors/inventory/print/` | `buildInventoryPdf()` — autoTable | grid table | — (shipped, commit `2abc7b4`) |
| `src/routes/vendors/categories/print/` | `buildCategoriesPdf()` + `buildCategoryRows()` | indented list, no autoTable | `ai-docs/categories-printable-spec.md` |

Eight routes remain. They fall into three shapes:

| Group | Routes | Shape |
|---|---|---|
| Transfer forms | STR, IBRR, RMA | label fields (ref/date/store/notes) + one items table |
| Customer reports | Sales by Customer, Open Sales by Customer, Purchases by Vendor | summary table + grouped detail (per-customer/per-vendor sections with PO sub-tables), `view = summary \| detail \| both` |
| Wide reports | Profit & Loss | dynamic monthly breakdown (one column per month) + by-product table |
| Receipt | Daily Sales receipt | letter-form receipt, auto-print on load, blank filler rows, signature box — **needs a user decision first** |

## Shared conventions (apply to every route below)

Extracted from the two done routes (`$lib/utils/pdf.ts`, `src/routes/vendors/inventory/print/pdf.ts`, `src/routes/vendors/categories/print/pdf.ts`) and `test/categories-printable.spec.ts`:

1. **Builder file:** `src/routes/<route>/print/pdf.ts` (or `.../[id]/print/pdf.ts`). Exports `buildXxxPdf(rows): jsPDF`. Must stay free of Svelte imports and of any `$lib` import except the shared helpers in `$lib/utils/pdf.ts` — so it runs in plain Node/vitest.
2. **Scaffolding:** open with `createReportDoc({ title, subtitle? })` (brand header + ruled title included); start content at `startY`; finish with `addReportFooter(doc)`. Keep ≥ ~48pt of bottom space per page (footer band).
3. **Trigger:** route already renders inside `PrintReportLayout` — pass `onPrint={() => openAndPrint(buildXxxPdf(rows))}`. `PrintReportLayout` already supports the `onPrint` prop and falls back to `window.print()` only when it is absent, so the preview HTML stays untouched.
4. **Currency:** standard jsPDF fonts have **no ₱ glyph** — render `Php 12,345.67` in PDFs (precedent: `inventory/print/pdf.ts:formatCurrencyPdf`). Preview keeps `formatCurrency` from `$lib/utils/common`.
5. **Numbers:** Postgres `numeric` arrives as **strings** — parse before anything numeric (every current page already does `parseFloat`; carry the same defensive parsing into the builders).
6. **Table defaults (autoTable, when used):** `theme: 'grid'`, `font: helvetica`, `fontSize: 9`, `showHead: 'everyPage'`, `overflow: 'linebreak'`, explicit dark `textColor` on `headStyles`/`footStyles` (the 'grid' theme defaults them to white-on-white on light fills), right-align numeric columns, fixed `cellWidth` for long text columns.
7. **Empty state:** single centered row (`colSpan` across, `halign: center`) — never an error page.
8. **WYSIWYG:** PDF content and order ≡ preview, by construction. When the preview computes something client-side (e.g. grouping, serial fan-out), factor it into a pure function used by *both* the preview and the PDF.
9. **Multi-section pages** (`both` view, grouped detail): render sections in order, advancing `y` from `doc.lastAutoTable.finalY`; a section that won't fit gets `doc.addPage()`; `page-break` hints from the HTML maps to a page break / `startY` reset in the PDF.
10. **Tests:** unit-test the builder(s) in `test/<route>-printable.spec.ts`. jsPDF 4 removed `doc.getText()` — parse the raw stream for literal text with `/\(((?:\\.|[^()\\])*)\)\s*Tj/g` (precedent: `test/categories-printable.spec.ts`).
11. **Hygiene:** Prettier tabs + single quotes (`.prettierrc`). Several pages in this area have mixed double-quote/2-space history — every touched file must pass `npm run check` and `npm run lint` as-is.

## Tasks (recommended order: simplest first)

| # | Route | Spec | Status |
|---|---|---|---|
| 1 | STR — `src/routes/vendors/transfers/strs/print/[id]` | `ai-docs/str-printable-spec.md` | ✅ done (2026-07-18: `pdf.ts` + `onPrint` wired, 13 tests, suite 23/23) |
| 2 | IBRR — `src/routes/vendors/transfers/ibrrs/print/[id]` | `ai-docs/ibrr-printable-spec.md` | ⬜ |
| 3 | RMA — `src/routes/vendors/transfers/rmas/print/[id]` | `ai-docs/rma-printable-spec.md` | ⬜ |
| 4 | Sales by Customer — `src/routes/reports/sales-by-customer/print` | `ai-docs/sales-by-customer-printable-spec.md` | ⬜ |
| 5 | Purchases by Vendor — `src/routes/reports/purchases-by-vendor/print` | `ai-docs/purchases-by-vendor-printable-spec.md` | ⬜ |
| 6 | Open Sales by Customer — `src/routes/reports/open-sales-by-customer/print` | `ai-docs/open-sales-by-customer-printable-spec.md` | ⬜ |
| 7 | Profit & Loss — `src/routes/reports/profit-loss/print` | `ai-docs/profit-loss-printable-spec.md` | ⬜ |
| 8 | Daily Sales receipt — `src/routes/customers/daily-sales/print/[id]` | `ai-docs/daily-sales-receipt-printable-spec.md` | ⬜ **blocked on user decision (Q1)** |
| 9 | Cleanup — kill the legacy path | below | ⬜ **after all of 1–8** |

### Per-route checklist (repeats for 1–8)

For each route, in this order (per-route gate):

- [ ] `clean-code`: create `pdf.ts` per its spec; wire `onPrint` in `+page.svelte`; factor shared client-side transforms into pure helpers
- [ ] `tester`: new `test/<route>-printable.spec.ts`; suite green (`npm test`); manual check of the route in `npm run dev` (summary / detail / both where applicable)
- [ ] `code-review`: diff reviewed, no 🔴 open
- [ ] `npm run check && npm run lint` clean on touched files

### Task 9 — cleanup (only after every route is on jsPDF)

- [ ] Remove the `window.print()` fallback in `src/lib/components/common/PrintReportLayout.svelte` (make `onPrint` required) — or keep it and say why
- [ ] Delete `src/lib/components/common/PrintInternalLayout.svelte` — **zero usages remain in `src/`** (verified by grep)
- [ ] Sweep `src/` for any remaining `window.print` and confirm none on user-facing paths
- [ ] `npm test && npm run check && npm run lint` green

## Global acceptance

1. Every route in the table above prints through `openAndPrint` — no `window.print()` reachable from any print page.
2. Every builder is importable from plain Node (no Svelte) and has a passing unit test.
3. Preview HTML is unchanged in content/order — only the print trigger path and (where the spec says) WIP artifacts change.
4. `npm test`, `npm run check`, `npm run lint` all green at the end.

## Related

- Shared scaffolding: `src/lib/utils/pdf.ts`
- Pattern (table): `src/routes/vendors/inventory/print/pdf.ts`
- Pattern (non-table): `src/routes/vendors/categories/print/pdf.ts` + `ai-docs/categories-printable-spec.md`
- Layout + print trigger plumbing: `src/lib/components/common/PrintReportLayout.svelte`
- Test precedent: `test/categories-printable.spec.ts`
- Contract: `PROJECT.md` (Conventions: server logic in `+page.server.ts`; DB layers)
