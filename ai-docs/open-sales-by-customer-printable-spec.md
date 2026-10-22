# Open Sales by Customer printable — port to the jsPDF print trigger (customer-grouped tables)

**For:** developer implementing the open-sales-by-customer print rework; reviewer verifying it.
**Scope:** `src/routes/reports/open-sales-by-customer/print/*` only.
**Goal:** replace the legacy `window.print()` trigger with the jsPDF pipeline for all three views — customer-grouped summary table and nested detail table, with customer/SO/grand totals.

Shared conventions 1–11 apply: see `ai-docs/print-migration-tasks.md`.

## Background / today

- `+page.server.ts` loads `?from=&to=&view=` (default `summary`; accepts `summary|detail|both`) via `getOpenSalesGroupedByCustomer(from, to)` — already **grouped**: `summary: { customer, total, sales: [...] }[]`, `detailed: { customer, total, sales: [{ sales_order_id, date_ordered, notes, total, items: [...] }] }[]`.
- **Summary table** (single `autoTable`-able grid): customer rows are **bold full-width rows** (colSpan 5), then per SO a row — "Sales Order" | date | SO# | notes (`-` when empty) | amount (right) — then a bold `… Total:` row per customer; `tfoot` Grand Total.
- **Detail view** — note the view value actually checked in the template is **`'detailed'`**, while `+page.server.ts`/route params document `'detail'` (`+page.svelte` checks `view === 'detailed' || view === 'both'`). ⚠️ That means `?view=detail` renders **only the summary**. See Q1.
- Detail table: customer bold row (colSpan 4) → per SO a bold `SO #id + date` row (colSpan 4) → item rows (item_name, qty, cost right, total right) → bold `SO #id Total:` → bold customer `… Total:` row; Grand Total footer.
- Grand Total computed in the component: sum of each customer's `sales[].total_cost` (i.e. **not** the precomputed `total` — verify equivalence; see Q2).
- Title `Open Sales by Customer` (+ `— Detail` / `— Summary` suffixes) from `reportTitle` binding.

## ⚠️ Decide before implementing

| # | Question | Evidence | Proposed |
|---|---|---|---|
| 1 | `view === 'detailed'` vs `detail` mismatch | `+page.svelte` detail block `view === 'detailed' \| 'both'`; server param documented as `detail` (compare `sales-by-customer/print/+page.svelte` which uses `'detail'`); links from lists should reveal which value is actually sent — **check the page that builds the print URL** before deciding | Make one value canonical across preview + PDF + PDF builder; keep the other as accepted alias for one release |
| 2 | Grand Total source: `sum(sales[].total_cost)` vs `customer.total` | `+page.svelte grandTotal` reduces nested `total_cost`; per-customer rows show `sale.total` — if the DB precomputes `total` identically they should match; if not, which is right? | Use one source for preview **and** PDF; if the two differ today, flag to user and pick the DB `total` field |

## Target design

### Files

| File | Action | Contents |
|---|---|---|
| `src/routes/reports/open-sales-by-customer/print/pdf.ts` | **create** | `buildOpenSalesPdf(data, { view }): jsPDF` — `summaryTable` + `detailTable` using autoTable with `colSpan` + per-row `rowStyles` for the bold grouping rows |
| `src/routes/reports/open-sales-by-customer/print/+page.svelte` | **modify** | wire `onPrint`; (per Q1) normalize the view check |
| `+page.server.ts` | keep (or: normalize `view` if Q1 aliases) | — |

### PDF format

`createReportDoc({ title, subtitle: <date range> })`, from `startY`:

- **Summary autoTable**, head `[Customer, Date, SO Number, Notes, Amount]`:
  - customer row: `colSpan 5`, bold; SO rows: label `Sales Order` in col 0, date long-format, SO#, notes `'- if empty'`, amount right `Php …`;
  - customer total row: `colSpan 4` bold `"{customer} Total:"`, amount bold right;
  - Grand Total: bold `colSpan 4` + amount — `foot` (single, last page) mirroring the `tfoot`.
  - Empty: centered `No data available.` (today's text).
- **Detail autoTable**, head `[Item, Quantity, Cost, Total]`: customer bold row (colSpan 4) → `SO #id  —  date` bold row (colSpan 4) → item rows → `SO #id Total:` bold (colSpan 3 + amount) → `{customer} Total:` bold (colSpan 3 + amount); Grand Total `foot`.
- Both: same as preview — summary, page break, `Detail` heading, detail.
- Bold grouping rows: `rowStyles` + `textColor [17,17,17]`; light fill (`[245,245,245]`) is optional — preview shows no fill, keep none.
- Numbers parsed from strings; `Php …` formatting (convention 4).
- `addReportFooter(doc)`.

### Acceptance criteria

1. Q1/Q2 resolved and recorded (decisions table filled in, not "proposed").
2. All 3 views print branded PDFs matching the preview — grouping rows, per-SO lines, per-customer totals, Grand Total present and equal in value to the preview.
3. `buildOpenSalesPdf` runnable from plain Node; passing vitest: single customer/SO, multi-SO customer, totals with string numerics, empty state, `both` page-break.
4. `npm run check && npm run lint` clean; view-value handling consistent across server, preview, builder.

## Verification

```
npm run dev
# /reports/open-sales-by-customer/print?view=summary → then detail/both (whichever value Q1 keeps)
# Print each → branded PDF; compare totals to preview
npm test -- open-sales
npm run check && npm run lint
```

## Tasks

- [ ] **user decision Q1 (view value) + Q2 (total source)**; inspect the print-URL builder in the list page for Q1
- [ ] `clean-code`: create `pdf.ts`; wire `onPrint`; apply Q1/Q2
- [ ] `tester`: `test/open-sales-printable.spec.ts` (+ regression on the summary-only-for-`detail` quirk if the alias is kept); dev check all views
- [ ] `code-review`: diff, no 🔴

## Related

- Shared: `src/lib/utils/pdf.ts` · Grouping-row pattern: none prior (first colSpan `foot`/grouping use — reviewer, watch the `rowStyles`)
- Data: `getOpenSalesGroupedByCustomer` in `src/lib/server/db/queries/reports/open-sales-by-customer`
- View-value comparison: `ai-docs/sales-by-customer-printable-spec.md`
