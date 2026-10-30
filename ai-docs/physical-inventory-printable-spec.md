# Spec — Physical Inventory Sheet Printable (jsPDF)

**Current state:** the Print button already exists on the detail page
`src/routes/vendors/physical-inventory/[physical_inventory_id]/+page.svelte`
(only when `status === 'finalized'`) — but it has no `onclick` and there is **no
print route, no PDF builder, no tests**. The rest of this task is the missing
machinery.

## What the sheet shows (view, `status === 'finalized'`)

Header: PC-00{id} · `{title}`. Card "Physical Inventory Sheet":

| Item | SKU/Item code | Category | Sys count | Counted | Difference (colored +/-) |

Data source: `getInventoryById(id)` in `src/lib/server/db/queries/physical-inventory.ts`
→ `{ id, title, status, items[{ sku, purchase_description, category, system_count, actual_count, difference }] }`.
The `physical_inventory` table also holds `date_finalized` and `created_by → users.id`
(not fetched today) — the printed sheet uses both (date finalized + prepared by).

## Conventions (mandatory — `ai-docs/print-migration-tasks.md`)

- Builder `…/print/[id]/pdf.ts`, `buildPhysicalInventoryPdf(data)` → `Promise<jsPDF>`;
  only import from `$lib/utils/pdf.ts`
- `createReportDoc({ title, subtitle? })` → content from `startY` → `addReportFooter(doc)`
- Currency `Php …` (N/A here — counts only), dates via `formatDatePdf`
- `drawField`/`drawNotes` for the header block, autoTable `theme:'grid'` for lines
- Preview in `PrintReportLayout` + `onPrint={async () => openAndPrint(build…(data))}`
- `+layout@.svelte` replacing the vendors layout (kills the SubHeader on the print tab)
- Tests: jsPDF-4 raw-stream `Tj` extraction (see `test/bills-printable.spec.ts`)

## Files

| File | Change |
|---|---|
| `src/lib/server/db/queries/physical-inventory.ts` | `getInventoryById` also returns `date_finalized` (+ `created_by` user name join) — additive, used by the print route; draft/edit flow untouched |
| `src/routes/vendors/physical-inventory/[physical_inventory_id]/print/[id]/+page.server.ts` — no: **`…/print/[id]/+page.server.ts`** placed at `src/routes/vendors/physical-inventory/print/[id]/` | load sheet; 404 on bad id |
| `…/print/[id]/pdf.ts` | `PhysicalInventoryPrintData` (structural mirror, local types), `buildPhysicalInventoryPdf()` |
| `…/print/[id]/+page.svelte` | sheet preview ≡ PDF |
| `…/print/[id]/+layout@.svelte` | bare pass-through + `app.css` (no SubHeader) |
| `src/routes/vendors/physical-inventory/[physical_inventory_id]/+page.svelte` | give the existing Print button its `onclick={openPrint}` → `window.open(`/vendors/physical-inventory/print/${id}`, '_blank')` |
| `test/physical-inventory-printable.spec.ts` | literal assertions: `PC-00{id}`, title, `Finalized`, item lines, `+N`/`-N` differences, totals row |

## PDF layout (portrait)

```
<brand header — createReportDoc>
Physical Inventory Sheet          PC-00{id} · Finalized
{title}                           <ruled title band>

FIELD ROW (drawField):
  PREPARED BY      DATE FINALIZED
  {user name}      {long date}

NOTES (drawNotes) if present

Items (autoTable, grid):
  Item                     | SKU | Category | Sys Count | Counted | Difference
  {purchase_description}   | …   | …        |      100 |      95 |          -5
  ...
  TOTAL (n items)          |     |          |     1200 |     1180 |         -20

<addReportFooter>
```

- Difference printed as-is with explicit sign: `+5` / `-5` / `0` (mirrors screen; no
  color in PDF — sign carries the meaning)
- Totals row sums system/actual/difference across lines
- Empty items (finalized with no lines) → single centered `No items were counted.` row
- Drafts: the print route is still reachable by URL — render as-is with the status
  field (`Draft`), the button simply isn't shown while editing

## Draft printing (added requirement)

Draft sheets get the **same Print button** (shown alongside *Save as Draft / Finalized*). The printed sheet is a **fill-in sheet**:

- **Counted** column: blank on every line (hand-written on paper)
- **Difference** column: blank on every line (derives from Counted)
- Totals row: only the **System Count** total prints; Counted/Difference totals stay blank
- Date Finalized prints as `—`, status subtitle shows `Draft`

Finalized printing is unchanged (all columns + all totals).

## Acceptance

- Finalized sheet → **Print** (button in finalized header) → tab opens `…/physical-inventory/print/{id}` with
  preview ≡ PDF, no SubHeader bar
- Draft sheet → **Print** (button in draft header) → same sheet, **Counted and Difference blank**, totals limited to system counts
- PDF (finalized) contains PC no, title, status, prepared by, date finalized, all lines with
  signed differences, and a totals row
- Draft flow (Save as Draft / Finalized actions) untouched
- New spec tests + full `vitest run` green; eslint/prettier/svelte-check clean (no
  new svelte-check errors)

## Verification

1. gates above
2. Manual: Physical Inventory → a finalized sheet → **Print**; plus a sheet with
   positive, negative, and zero differences and check the signs and totals

- Draft sheets: same print tab, **Counted** and **Difference** columns (per row *and* in the totals row) print blank as a fill-in sheet; `DATE FINALIZED` renders `—`; draft header shows **Save as Draft / Finalized / Print**
- Empty-sheet placeholder text is neutral (`No items on this inventory sheet.`) since it applies to both statuses
- Draft PDF live-verified against DB sheet 2 (counted/diff absent, system totals present, `PC-002 · Draft`)

## Implementation notes (as-built)

- `getInventoryById` is additive: returns `date_finalized`, `created_by` (resolves to the user's **name** via the existing `physicalInventories.created_by → users` relation), and `notes` alongside the existing fields — the draft/edit flow on the detail page is untouched
- `PrintReportLayout` only accepts `reportTitle` (no `subtitle` prop) — the preview folds `PC-00{id} · {status}` into the `reportTitle` string; the PDF keeps them as the `createReportDoc` subtitle (right-aligned, per the bills pattern)
- Totals row rendered as an autoTable `foot` (`Total (n items)` + per-column sums); hidden when the sheet has no lines — mirrors the `Inventory List` totals convention
- `+layout@.svelte` is placed at `print/[id]/+layout@.svelte` so the print tab renders without the vendors `SubHeader`
- Draft sheets can still be opened by URL — the PDF renders them with the `Draft` status; the button simply isn't shown while editing
- Live-DB verified: sheet id=1 (finalized, 5 lines) and id=2 (draft, 0 lines) both resolve correctly through `getInventoryById`
- Gates: vitest 183/183, eslint clean, prettier clean, svelte-check 0 new errors
