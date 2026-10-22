# IBRR printable — port to the jsPDF print trigger (form + items table)

**For:** developer implementing the IBRR print rework; reviewer verifying it.
**Scope:** `src/routes/vendors/transfers/ibrrs/print/[id]/*` only.
**Goal:** replace the legacy `window.print()` trigger with the jsPDF pipeline — keep the exact layout (reference fields + notes box + items table) in the PDF.

Shared conventions 1–11 apply: see `ai-docs/print-migration-tasks.md`. This spec lists only the IBRR-specific design.

## Background / today

- Trigger: `PrintReportLayout` with **no `onPrint`** → `window.print()` fallback.
- Content: label rows — `IBRR REFERENCE NO.` (IBRR-`{id}`) / `STR REFERENCE NO.` (STR-`{str_id}`), `SOURCE STORE` ({source_store_name}), `NOTES` box (`min-h-12`, `---` when empty) — then **Items Received** table: Product, Qty, Cost, Total Cost (4 columns, no serial column).
- Data: `getIBRRById(Number(id))` in `+page.server.ts`. Note: the existing server file imports `PageServerLoad` from `'../$types'` (parent dir) — pre-existing quirk, leave it unless lint complains.

## Target design

### Files

| File | Action | Contents |
|---|---|---|
| `src/routes/vendors/transfers/ibrrs/print/[id]/pdf.ts` | **create** | `buildIbrrPdf(ibrr): jsPDF` — label block + autoTable items |
| `src/routes/vendors/transfers/ibrrs/print/[id]/+page.svelte` | **modify** | wire `onPrint={() => openAndPrint(buildIbrrPdf(ibrr))}` |
| `src/routes/vendors/transfers/ibrrs/print/[id]/+page.server.ts` | keep | — |

### PDF format

`createReportDoc({ title: 'Inter-Branch Receiving Report' })`, then:

1. **Label rows**: `IBRR REFERENCE NO.` / `STR REFERENCE NO.` side by side; `SOURCE STORE` second row; `NOTES` wrapped block (`---` for empty). Same LABEL-above-value style as the STR spec.
2. **Rule + "Items Received"** heading.
3. **autoTable**: head `[Product, Qty, Cost, Total Cost]`; Qty/Cost/Total right (`Php …`); Product free width, `overflow: linebreak`; empty → single centered row (wording below).
4. `addReportFooter(doc)`.

### Decisions (need user confirm)

| # | Question | Proposed |
|---|---|---|
| 1 | Empty-items wording — today reads `No items found for the selected Stock Transfer Request.` (an IBRR is not a "selected STR") | `No items found for this Inter-Branch Receiving Report.` in **both** preview and PDF |

### Acceptance criteria

1. Preview unchanged except the corrected empty-state wording (if Q1 approved).
2. Print → branded PDF with both reference numbers, source store, notes, items autoTable, footer on every page — **no `window.print()` path on this route**.
3. `buildIbrrPdf` runnable from plain Node; passing vitest (empty items, long product names wrap, empty notes → `---`).
4. `npm run check && npm run lint` clean on touched files.

## Verification

```
npm run dev
# open an IBRR list entry → Print → new tab: branded PDF, IBRR-####/STR-#### refs, items table
npm test -- ibrr
npm run check && npm run lint
```

## Tasks

- [ ] `clean-code`: create `pdf.ts`; wire `onPrint`; fix empty-state wording if Q1 approved
- [ ] `tester`: `test/ibrr-printable.spec.ts`; dev check of the printed IBRR
- [ ] `code-review`: diff, no 🔴

## Related

- Shared: `src/lib/utils/pdf.ts` · Nearest same-shape spec: `ai-docs/str-printable-spec.md`
- Data: `src/lib/server/db/queries/ibrrs.ts` (`getIBRRById`)
