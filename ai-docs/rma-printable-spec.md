# RMA printable — port to the jsPDF print trigger (form + items table)

**For:** developer implementing the RMA print rework; reviewer verifying it.
**Scope:** `src/routes/vendors/transfers/rmas/print/[id]/*` only.
**Goal:** replace the legacy `window.print()` trigger with the jsPDF pipeline — keep the layout (reference fields + supplier + notes box + items table) — and fix the wrong report title.

Shared conventions 1–11 apply: see `ai-docs/print-migration-tasks.md`. This spec lists only the RMA-specific design.

## Background / today

- Trigger: `PrintReportLayout` with **no `onPrint`** → `window.print()` fallback.
- Content: `RMA REFERENCE NO.` (RMA-`{id}`) / `TRANSFER DATE` (`date_returned`), `SUPPLIER` ({supplier_name}), `NOTES` box, then **Items Received** table: Product, Serial Number, Qty, Cost, Total Cost (5 columns).
- Data: `getRMAById(Number(id))`; page reads `page.data?.rma` via `$app/state`.

## ⚠️ Suspected bug (Q1 — decide before implementing)

The page is titled **`reportTitle="Inter-Branch Receiving Report"`** (`src/routes/vendors/transfers/rmas/print/[id]/+page.svelte`) — that is the *IBRR* title (see `src/routes/vendors/transfers/ibrrs/print/[id]/+page.svelte`). The empty-items row also says "selected Stock Transfer Request". Both look like copy-paste from the transfer pages.

| # | Question | Proposed (needs user confirm) |
|---|---|---|
| 1 | Report title | `Return Merchandise Authorization` (or user's preferred business name) in preview **and** PDF |
| 2 | Empty-items wording | `No items found for this RMA.` in both |

## Target design

### Files

| File | Action | Contents |
|---|---|---|
| `src/routes/vendors/transfers/rmas/print/[id]/pdf.ts` | **create** | `buildRmaPdf(rma): jsPDF` — label block + autoTable items |
| `src/routes/vendors/transfers/rmas/print/[id]/+page.svelte` | **modify** | wire `onPrint`; correct `reportTitle` (Q1) and empty-state wording (Q2) |
| `src/routes/vendors/transfers/rmas/print/[id]/+page.server.ts` | keep | — |

### PDF format

`createReportDoc({ title: <corrected title> })`, then:

1. **Label rows**: `RMA REFERENCE NO.` / `TRANSFER DATE` side by side; `SUPPLIER` second row; `NOTES` wrapped block (`---` when empty). LABEL-above-value style per the STR spec.
2. **Rule + "Items Received"** heading.
3. **autoTable**: head `[Product, Serial Number, Qty, Cost, Total Cost]`; serial `'' → '--'`; Qty/Cost/Total right (`Php …`); empty → centered row per Q2.
4. `addReportFooter(doc)`.

### Acceptance criteria

1. Title fixed in preview **and** PDF (per Q1 answer); the old IBRR title does not remain anywhere on this route.
2. Print → branded PDF with refs, supplier, notes, 5-column items table, footer on every page — **no `window.print()` path on this route**.
3. `buildRmaPdf` runnable from plain Node; passing vitest (empty items, empty serials → `--`, empty notes → `---`, long names wrap).
4. `npm run check && npm run lint` clean on touched files.

## Verification

```
npm run dev
# open an RMA list entry → Print → new tab: corrected title, RMA-#### ref, items table
npm test -- rma
npm run check && npm run lint
```

## Tasks

- [ ] **user decision Q1/Q2** (title + wording)
- [ ] `clean-code`: create `pdf.ts`; wire `onPrint`; fix title/wording
- [ ] `tester`: `test/rma-printable.spec.ts`; dev check of the printed RMA
- [ ] `code-review`: diff, no 🔴

## Related

- Shared: `src/lib/utils/pdf.ts` · Same-shape specs: `ai-docs/str-printable-spec.md`, `ai-docs/ibrr-printable-spec.md`
- Data: `src/lib/server/db/queries/rmas.ts` (`getRMAById`)
