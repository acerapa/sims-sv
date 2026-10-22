# STR printable — port to the jsPDF print trigger (form + items table)

**For:** developer implementing the STR print rework; reviewer verifying it.
**Scope:** `src/routes/vendors/transfers/strs/print/[id]/*` only.
**Goal:** replace the legacy `window.print()` trigger with the jsPDF pipeline — keep the exact layout (reference fields + notes box + items table) in the PDF.

Shared conventions 1–11 apply: see `ai-docs/print-migration-tasks.md`. This spec lists only the STR-specific design.

## Background / today

- Trigger: `PrintReportLayout` with **no `onPrint`** → its `window.print()` fallback (`src/lib/components/common/PrintReportLayout.svelte:handlePrint`).
- Content: label fields in underline boxes (STR `{ref}`, transfer date, destination store, a min-height notes box) then an **Items Received** table — Product, SN, Qty, Cost, Total Cost.
- Quirk: the route fans out multi-serial items inline — a `STRItem` with N serials renders as N rows of qty 1 (the `items` derived in `src/routes/vendors/transfers/strs/print/[id]/+page.svelte`).
- Data: `getStrById(Number(id))` in `+page.server.ts`; no 404 if missing (`str?.` guards everywhere).

## Target design

### Files

| File | Action | Contents |
|---|---|---|
| `src/routes/vendors/transfers/strs/print/[id]/pdf.ts` | **create** | `expandSerials(items: STRItem[]): STRItem[]` (pure, from the component) + `buildStrPdf(str, items): jsPDF` |
| `src/routes/vendors/transfers/strs/print/[id]/+page.svelte` | **modify** | wire `onPrint`; use the shared `expandSerials` for the preview instead of the inline derived (preview ≡ PDF) |
| `src/routes/vendors/transfers/strs/print/[id]/+page.server.ts` | keep | data shape already fine |

### PDF format

`createReportDoc({ title: 'Stock Transfer Report' })` (title from `PrintReportLayout reportTitle`), then, top to bottom:

1. **Label rows** (mirror the underline boxes): two columns of `LABEL` (8pt bold gray) over `value` (10pt). Order of today: `STR REFERENCE NO.` / `TRANSFER DATE` on row 1, `DESTINATION` on row 2, then `NOTES` as a left-aligned block (wrapped with `doc.splitTextToSize`, `---` when empty).
2. **Rule + "Items Received"** heading (mirrors `<p class="mt-4 font-bold">` + `<hr>`).
3. **autoTable** items: head `[Product, SN, Qty, Cost, Total Cost]`; body from `expandSerials(items)` — SN `'' → '--'`; Qty right; Cost/Total right (`Php …`); empty → single centered row `No items found for this Stock Transfer Request.` (today's text says "selected" with no selection — pick one, keep preview and PDF identical; recommend the non-"selected" wording).
4. `addReportFooter(doc)`.

### Decisions

| # | Question | Proposed (needs user confirm) |
|---|---|---|
| 1 | Empty-items row wording ("selected" is inaccurate for a single-STR print) | `No items found for this Stock Transfer Request.` in **both** preview and PDF |
| 2 | RMA sibling page's title says "Inter-Branch Receiving Report" for an RMA | Out of scope here; flagged for the RMA spec (Q1 there) |

### Acceptance criteria

1. Preview unchanged except it now uses shared `expandSerials` (same rows as today).
2. Print → branded PDF with the two label rows, notes block, ruled heading, items autoTable, footer on every page — **no `window.print()` path on this route**.
3. Multi-serial item (N serials) → N rows of qty 1 in the PDF, same as preview.
4. `expandSerials` + `buildStrPdf` runnable from plain Node; passing vitest (empty items, single item, multi-serial fan-out, long product names wrap).
5. `npm run check && npm run lint` clean on touched files.

## Verification

```
npm run dev
# open a STR list entry → Print → new tab: branded PDF, STR-#### ref, items table
npm test -- str
npm run check && npm run lint
```

## Tasks

- [ ] `clean-code`: extract `expandSerials` pure helper; create `pdf.ts`; wire `onPrint`
- [ ] `tester`: `test/str-printable.spec.ts`; dev check of the printed STR
- [ ] `code-review`: diff, no 🔴

## Related

- Shared: `src/lib/utils/pdf.ts` · Preview/table pattern: `src/routes/vendors/inventory/print/pdf.ts`
- Data: `src/lib/server/db/queries/strs.ts` (`getStrById`) · Types: `STRItem` in `$lib/types/global`
