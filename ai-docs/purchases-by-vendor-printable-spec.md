# Purchases by Vendor printable — port to the jsPDF print trigger (summary + grouped detail)

**For:** developer implementing the purchases-by-vendor print rework; reviewer verifying it.
**Scope:** `src/routes/reports/purchases-by-vendor/print/*` only.
**Goal:** replace the legacy `window.print()` trigger with the jsPDF pipeline for all three views — summary table, per-vendor detail sections (PO sub-tables), totals.

Shared conventions 1–11 apply: see `ai-docs/print-migration-tasks.md`.

## Background / today

- `+page.server.ts` loads `?from=&to=&view=` (default `summary`) via `getPurchasesByVendorSummary/Detail(from, to)` — loads only the view(s) it needs.
- **Summary**: 4-col table — Vendor Name, # of POs, Total Items Received, Total Amount — + Grand Total `tfoot`.
- **Detail**: grouping is **client-side** — `groupDetailByVendor(rows)` in `+page.svelte` (vendor → POs → items, with `subtotal`). One section per vendor (`<h3>` vendor name, page-break between vendors in `detail` view), per PO a `po_reference` + receive-date header line, 4-col items table (Product, Qty, Unit Cost, Total Cost), right-aligned `Subtotal:` per vendor.
- Titles/subtitle/empty-state text as in the sibling reports; `Php`/`₱` handled per conventions (PDF `Php`, preview `₱` via `formatCurrency`).

## Target design

### Files

| File | Action | Contents |
|---|---|---|
| `src/routes/reports/purchases-by-vendor/print/pdf.ts` | **create** | `buildPurchasesByVendorPdf(data, { view }): jsPDF` |
| `src/routes/reports/purchases-by-vendor/print/+page.svelte` | **modify** | wire `onPrint`; **move `groupDetailByVendor` out of the component** into `pdf.ts` (pure fn, no Svelte) and import it for the preview — required so preview ≡ PDF by construction and the builder stays Node-testable (conventions 8 + 1) |
| `src/routes/reports/purchases-by-vendor/print/+page.server.ts` | keep | — |

### PDF format

Same structure as `ai-docs/sales-by-customer-printable-spec.md`, swapping:

- Summary head: `[Vendor Name, # of POs, Total Items Received, Total Amount]`; Grand Total `foot` with the `grandTotals` reduces (strings parsed!).
- Detail per vendor: heading = `supplier_name`; per-PO header line = `po_reference` + `formatDate(receive_date)`, title-cased as preview; items head `[Product, Qty, Unit Cost, Total Cost]`; `Subtotal: Php …` per vendor.
- Vendor order = today's grouping order (query order of first appearance).
- Empty texts stay as today: `No purchase orders found for the selected date range.`
- `both` view: page break + `Detail` heading, exactly as now.

### Decisions

| # | Question | Proposed (confirm) |
|---|---|---|
| 1 | Moving `groupDetailByVendor` into `pdf.ts` (shared with preview) | Yes — single source of truth; preview import keeps output identical |
| 2 | `GroupedVendor` interface | Lives in `pdf.ts` (exported) in place of the current local interface in `+page.svelte` |

### Acceptance criteria

1. Preview output **unchanged** after the refactor (grouping moved, not changed) — all 3 views.
2. All 3 views print through `openAndPrint` → branded PDF matching preview order and totals; **no `window.print()` path remains via `onPrint`**.
3. `buildPurchasesByVendorPdf` + `groupDetailByVendor` runnable from plain Node; passing vitest: grouping order/vendor dedupe, subtotal math with string numerics, empty detail, Grand Total row.
4. `npm run check && npm run lint` clean; no leftover duplicate `GroupedVendor` definition.

## Verification

```
npm run dev
# /reports/purchases-by-vendor/print?view=summary|detail|both → Print each
npm test -- purchases
npm run check && npm run lint
```

## Tasks

- [ ] `clean-code`: create `pdf.ts` incl. moved `groupDetailByVendor` + `GroupedVendor`; wire `onPrint`
- [ ] `tester`: `test/purchases-by-vendor-printable.spec.ts`; dev check of all 3 views (incl. pre-refactor screenshot/diff of preview)
- [ ] `code-review`: diff, no 🔴

## Related

- Sibling pattern: `ai-docs/sales-by-customer-printable-spec.md`
- Data: `getPurchasesByVendorSummary` / `getPurchasesByVendorDetail` in `src/lib/server/db/queries/reports` (see `VendorDetailRow` in the same module)
- Preview code being refactored: `src/routes/reports/purchases-by-vendor/print/+page.svelte`
