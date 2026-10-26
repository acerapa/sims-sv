# Sales by Customer printable — port to the jsPDF print trigger (summary + grouped detail)

**For:** developer implementing the sales-by-customer print rework; reviewer verifying it.
**Scope:** `src/routes/reports/sales-by-customer/print/*` only.
**Goal:** replace the legacy `window.print()` trigger with the jsPDF pipeline for **all three views** (`summary`, `detail`, `both`) — summary table, per-customer detail sections, grand totals.

Shared conventions 1–11 apply: see `ai-docs/print-migration-tasks.md`.

## Background / today

- `+page.server.ts` loads from `?from=&to=&view=` (default `summary`; `view ∈ summary|detail|both`) via `getSalesByCustomer(from, to)` — returns `{ summary, detailed }`.
- **Summary view**: 4-col table — Customer Name, # of Orders, Total Items Sold, Total Amount — with a **Grand Total** `tfoot` row (totals computed with `Number()` reduce — numeric fields arrive as strings).
- **Detail view**: one section per customer: `<h3>` customer name, then per order a `SO-{id}` header line (date, capitalized status) + 4-col items table (Product, Qty, Unit Price, Total Price), then a right-aligned **Subtotal** line per customer. Customers flow continuously — no forced page break between them (originally the `detail` view forced one per customer; removed per client feedback, see decision 3).
- **Both** = summary, forced page break, `Detail` heading, detail.
- Title varies by view (`Sales by Customer`, `… — Summary`, `… — Detail`); date-range subtitle rendered from `data.filters` by `PrintReportLayout`.
- Preview formats via `formatCurrency` (`$lib/utils/common`) and `formatDate` (`$lib/utils/printables`).

## Target design

### Files

| File | Action | Contents |
|---|---|---|
| `src/routes/reports/sales-by-customer/print/pdf.ts` | **create** | `buildSalesByCustomerPdf(data, { view }): jsPDF` dispatching to `summaryTable`, `detailSections` |
| `src/routes/reports/sales-by-customer/print/+page.svelte` | **modify** | wire `onPrint` passing `data` + `view` (the same values that drive the preview) |
| `src/routes/reports/sales-by-customer/print/+page.server.ts` | keep | — |

The builder signature should take exactly what `+page.svelte` already holds for the preview, so **preview ≡ PDF by construction** (convention 8):

```ts
export interface SalesByCustomerData {
	summary: { customer_name: string; total_orders: string | number; total_items: string | number; total_sales: string | number }[];
	detailed: {
		customer_name: string;
		subtotal: string | number;
		orders: {
			sales_order_id: number;
			date_ordered: string;
			order_status: string;
			items: { product_name: string; item_quantity: string | number; item_price: string | number; item_total: string | number }[];
		}[];
	}[];
}
```
(Match the real field names from `getSalesByCustomer` — the shape above mirrors the preview bindings; verify against `src/lib/server/db/queries/reports/sales-by-customer.ts`.)

### PDF format

`createReportDoc({ title: <view title>, subtitle: <date range label as PrintReportLayout renders it> })`, from `startY`:

- **Summary table (autoTable)** — head `[Customer Name, # of Orders, Total Items Sold, Total Amount]`; numeric cols right; money as `Php …`; `foot` when rows exist: `Grand Total` with the same three reduces the preview does. Empty → centered row `No sales orders found for the selected date range.` (today's exact text).
- **Detail sections** — per customer, in preview order:
  1. Section heading: customer name (bold, `startY`/`finalY` advanced ~18pt; if not ≥ ~45pt + heading + one table row fit on the page, `doc.addPage()` first — this replaces the `page-break` hint).
  2. Per order: header line `SO-{id}` + date (long format, same as `formatDate`) + status (title-cased, mirroring the CSS `text-transform: capitalize`).
  3. Items autoTable per order: head `[Product, Qty, Unit Price, Total Price]`; Qty/price right; `Php …`.
  4. Right-aligned bold `Subtotal: Php …` line after each customer's last table (mirrors `.print-vendor-subtotal`).
  5. Gap (~10pt) before the next customer.
  - Empty → centered `No sales orders found for the selected date range.`
- `both`: summary → `doc.addPage()` (the `.page-break`) → `Detail` heading → detail sections.
- `addReportFooter(doc)`.

### Decisions

| # | Question | Decision |
|---|---|---|
| 1 | `order_status` casing in PDF | title-case in JS (e.g. `Pending Payment`) — mirrors CSS `capitalize` at the word level the preview shows |
| 2 | Section page-breaks in `both` view | today's CSS only forces a page break per customer in `detail` view — PDF mirrors that exactly (no forced break in `both`). Superseded by decision 3 |
| 3 | Per-customer page breaks (client feedback) | customer sections flow continuously in **all** views, including `detail`; no forced `addPage` between customers — `ensureSpace` still breaks a page when a customer block physically overflows; tests assert it (2-customer detail fits one page; 30 customers paginate below 30 pages) |

### Acceptance criteria

1. All three `view` values produce the branded PDF; content and order ≡ the preview for that view; date-range subtitle present.
2. Grand Total (summary) and per-customer Subtotals (detail) match the preview's computed values exactly.
3. Long customer/product names wrap; deep data (20+ customers) paginates with header repeated (`showHead: 'everyPage'`) and footer on every page — **no `window.print()` path remains via `onPrint`**.
4. `buildSalesByCustomerPdf` runnable from plain Node; passing vitest covering: summary totals row, detail section order, empty summary, empty detail, `both`.
5. `npm run check && npm run lint` clean on touched files.

## Verification

```
npm run dev
# /reports/sales-by-customer/print?view=summary|detail|both&from=…&to=…
# Print each → new tab: branded PDF matching the preview for that view
npm test -- sales-by-customer
npm run check && npm run lint
```

## Tasks

- [ ] `clean-code`: create `pdf.ts` (summary + detail builders); wire `onPrint`
- [ ] `tester`: `test/sales-by-customer-printable.spec.ts`; dev check of all 3 views
- [ ] `code-review`: diff, no 🔴

## Related

- Shared: `src/lib/utils/pdf.ts` · Precedent (foot/totals): `src/routes/vendors/inventory/print/pdf.ts`
- Data: `src/lib/server/db/queries/reports/sales-by-customer.ts` (`getSalesByCustomer`)
- Same-shape sibling: `ai-docs/purchases-by-vendor-printable-spec.md`
- Formatters: `src/lib/utils/common.ts` (`formatCurrency`), `src/lib/utils/printables.ts` (`formatDate`)
