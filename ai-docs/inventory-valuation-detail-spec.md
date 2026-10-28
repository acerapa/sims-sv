# Inventory Valuation Detail — new report (spec DRAFT, pending user approval)

**For:** developer (clean-code) implementing the report; tester; reviewer.
**Scope:** new report route `src/routes/reports/inventory-valuation/*` + new query module + report-home card. No changes to product/quantity write paths.
**Goal:** for each inventory item over a date range, list every transaction that moved its stock (purchase, inter-branch received, transfer out, fixed-asset, sale) with running on-hand quantity and asset value after each — the QuickBooks "Inventory Valuation Detail" equivalent for this app, useful for tracing stock/value over time and reconciling the inventory asset on the balance sheet.

Shared conventions for the print side apply: see `ai-docs/print-migration-tasks.md` (builders in Node-pure `pdf.ts`, `createReportDoc`/`addReportFooter`, `openAndPrint`, `Php` currency, autoTable defaults).

## Background — what actually moves stock in this codebase

Audit of every `update(products).set({ quantity: … })` (grep-verified):

| Movement (report label) | Row source | Date column | Δ qty | Row unit cost | Code |
|---|---|---|---|---|---|
| **Purchase** (PO received) | `purchase_order_items` ⋈ `purhase_order` (note the typo'd table name) + `suppliers` | `receive_date` | `+poi.quantity` | `poi.cost` | `queries/po.ts:60` |
| **Inter-Branch Received** (IBRR) | `ibrr_items` ⋈ `ibrrs` | `received_date` | `+quantity` | `cost` | `queries/ibrrs.ts:68` |
| **Stock Transfer Out** (STR) | `str_items` ⋈ `stock_transfer_requests` | `transfer_date` | `−quantity` | `cost` | `queries/strs.ts:64` |
| **Fixed Asset** (issued to staff) | `fix_assets_items` ⋈ `fix_assets` | `date_transfered` | `−quantity` | `cost` | `queries/fix-assets.ts:120` |
| **Sale** (sales order created; package lines expanded via `packages_to_products` — the app deducts components, not the package) | `sales_order_items` ⋈ `sales_orders` + `customers` | `date_ordered` | `−quantity (× pkg comp qty)` | **no historical cost stored** — use `products.cost` as of today | `queries/sales-orders.ts:111,124,324,337,364,377` |

**Does NOT move stock (verified — no `update(products)` in those paths):** bills, invoices/payments, **RMA** (`queries/rmas.ts` — creates rows only), **physical inventory finalize** (`queries/physical-inventory.ts` — flips status/date only), product form edits (sets an absolute quantity, no audit trail), sales-order *edits/cancellation* (partial: `updateSalesOrder` adds back removed lines ~`sales-orders.ts:270,283`; `cancelSalesOrderById` only flips status, no stock restore).

Consequence: the app has **no stock-movement ledger** — history must be *reconstructed* from the document tables. Reconstructed ending on-hand ≈ `products.quantity`; any gap is the manual edits / sales-order edits — which is exactly the reconciliation signal this report provides (surface it, don't hide it).

## Data model

Single query per view in `src/lib/server/db/queries/reports/inventory-valuation.ts` (folder precedent: `reports/open-sales-by-customer.ts`):

1. **`movements` CTE** — `UNION ALL` of the 5 row sources above; every branch emits:
   `product_id, txn_date, doc_id, line_id, delta (int), unit_cost (numeric), txn_type ('Purchase'|…), ref_no (PO ref / IBRR-#### / STR-#### / FA-#### / SO-####), counterparty (supplier/customer/empty)`
   - Package expansion only for sales: join `packages_to_products` on `sales_order_items.package_id = …` → one movement row per component (`delta = −(comp.quantity × line.quantity)`), component's current `products.cost` as `unit_cost`.
   - Canceled sales orders **still included** (the app deducted stock at creation and never restores it — including them matches the DB reality; the row keeps `txn_type = 'Sale'`).
2. **`running` CTE** — window over the **unfiltered** history:
   ```
   on_hand_after   = SUM(delta)        OVER (PARTITION BY product_id ORDER BY txn_date, doc_id, line_id ROWS UNBOUNDED PRECEDING)
   asset_value_after = on_hand_after × unit-cost-basis (see Q1)
   ```
   (If Q1 = current cost: `SUM(delta * products.cost) OVER (…)`.)
3. **Detail projection** — join `products` (sku, descriptions), `categories`; filter `txn_date` into `[from, to+1day)` (same `::timestamp` idiom as `queries/reports.ts:buildDateConditions`); optional `product_id`; also emit an **opening balance row** per product (running balance just before `from`, `txn_type = 'Opening'`, `delta = 0`) and a per-product **reconciliation marker**: `computed_on_hand_today` vs `products.quantity`.
4. **Summary projection** — per product: opening, `+` total in, `−` total out, movement count, ending on-hand, ending asset value (= opening + Δ, or `products.quantity` × cost for today).

Row order: `product (sku) → txn_date → doc_id → line_id`. Same-day tie-break is document id (stable, deterministic; real-world time isn't separable — flagged as assumption A2).

## Target design — files

| File | Action | Contents |
|---|---|---|
| `src/lib/server/db/queries/reports/inventory-valuation.ts` | **create** | `getInventoryValuationDetail(from, to, productId?)`, `getInventoryValuationSummary(from, to, productId?)`, exported row types; raw-SQL via `db.execute` + typed interfaces (precedent: `queries/reports.ts`) |
| `src/routes/reports/inventory-valuation/+page.server.ts` | **create** | `load` reading `?from=&to=&product=&view=` (default view `detail`), zod-free same as siblings; `error(404/400)` conventions if later extended |
| `src/routes/reports/inventory-valuation/+page.svelte` | **create** | Filters: From/To `DatePicker`, product select (All / by SKU, source: products list — follow `vendors/inventory` search UX), View tabs (`Detail` / `Summary`, precedent `purchases-by-item`); per-product sections: header (SKU, name, category) + table **Date · Type · Ref No · Counterparty · Qty (+/−) · Unit Cost · On Hand After · Asset Value After** — numeric cols right-aligned, `formatCurrency` (₱) in preview; opening row styled distinct (muted); reconciliation footnote per product when `computed ≠ products.quantity`; Print button → `window.open('/reports/inventory-valuation/print?…')` (precedent `purchases-by-item/+page.svelte:74`) |
| `src/routes/reports/inventory-valuation/pdf.ts` | **create** | Node-pure builder `buildInventoryValuationPdf({ detail, summary }, view, filters)` + pure grouping helper shared with preview (convention 8); `createReportDoc({ title: 'Inventory Valuation Detail', subtitle: date range })`; per-product heading + autoTable `[Date, Type, Ref, Item, Qty, Unit Cost, On Hand, Asset Value]`, `Php …` via `formatCurrencyPdf`, `showHead: 'everyPage'`, empty-state centered row, section page-breaks, `addReportFooter(doc)` |
| `src/routes/reports/inventory-valuation/print/+page.server.ts` | **create** | re-loads same params → passes to preview + `onPrint` |
| `src/routes/reports/inventory-valuation/print/+page.svelte` | **create** | `PrintReportLayout` with required `onPrint={() => openAndPrint(buildInventoryValuationPdf(…))}` (convention 3 — `onPrint` is now required, no `window.print()` fallback exists) |
| `src/routes/reports/+page.svelte` | **modify** | add card under **Inventory Reports**: `title: 'Inventory Valuation Detail'`, `subtitle: 'Every stock movement per item with running on-hand and asset value'`, `href: '/reports/inventory-valuation'` |
| `test/inventory-valuation.spec.ts` | **create** | builder tests (see Acceptance) |

## Column semantics

- **Qty**: signed (`+12` / `−5`), integer (all row stores are `integer` — `str_items`/`ibrr_items` even use `integer` not `decimal`).
- **Unit Cost**: as recorded on the movement row (PO/IBRR/STR/FA); for sales = product's current cost, clearly the one approximation in the model (costs are never snapshotted for sales).
- **On Hand After**: running cumulative from full history (window fn) — can go **negative** if data is inconsistent (show it; don't clamp).
- **Asset Value After**: per Q1 below.

## Decisions — APPROVED by user (2026-06-12)

| # | Decision | Approved |
|---|---|---|
| Q1 | **Asset Value After = running on-hand × current `products.cost`** (option a). Per-row "Unit Cost" still shows what each transaction recorded | ✅ (a) |
| Q2 | **RMA & physical inventory counts EXCLUDED** (they don't change stock in this app — verified in code). Note in report caption. *Make-them-adjust = separate future task* | ✅ exclude |
| Q3 | **Both views**: `Detail` (default) + `Summary` (Item · Opening stock · + In · − Out · Ending stock · Ending value) | ✅ both |
| Q4 | **Canceled sales counted as − movements** (app deducts stock at creation, never restores) | ✅ |
| Q5 | **Sale rows show current `products.cost`** as unit cost (no historical cost stored) | ✅ |
| Q6 | Opening-balance row per product at range start | ✅ (kept from draft) |

## Assumptions (flag only)

- A1: report is read-only analytics; **no** write-path changes (no stock-movement ledger table). If reconciliation gaps (manual edits, sales-order edits) are deemed unacceptable, the follow-up is an `inventory_movements` ledger written by each mutating path — larger task, spec separately.
- A2: same-day ordering tie-break = document id (not wall-clock); business dates are user-entered and can be edited later.
- A3: `products.quantity` is a single global stock count (no per-store split in schema).
- A4: sales cost approximation (per Column semantics) — accepted until a cost snapshot exists.

## Acceptance criteria

1. `/reports/inventory-valuation?from=&to=` renders per-item sections with the 8-column table; opening rows present; totals reconcile: for any item, `opening + Σmovements-in-range` matches the window-fn values shown; numeric strings parsed (`parseFloat` everywhere, convention 5).
2. Item where reconstructed today's balance ≠ `products.quantity` → reconciliation footnote visible (e.g. item touched by manual edit).
3. Product filter + `view=summary` work from page **and** print route; empty range → centered empty-state row, not an error page.
4. Print → branded jsPDF (header, per-item sections, `Php` currency, footer per page), preview ≡ PDF order/rows by construction (shared pure grouping fn); **no** `window.print()` path.
5. `npm run check && npm run lint` clean on touched files; `npm test` green with new `test/inventory-valuation.spec.ts` (running-balance math incl. negative on-hand, string-numeric parsing, opening row, empty range, package expansion, PDF literal-text assertions per convention 10).
6. Report home: new Inventory card navigates to the route.

## Verification

```
npm run dev
# /reports → Inventory Reports → Inventory Valuation Detail
# pick a range with PO/IBRR/STR/FA/sales activity (see .tmp-pdf-test data or dev seed);
# check one item by hand against source documents, then /print → PDF
npm test -- inventory-valuation
npm run check && npm run lint
```

## Tasks (pipeline gates per conductor)

- [x] `clean-code`: query module + page + pdf.ts + print route + report-home card — **done 2026-07-20**
- [x] `tester`: `test/inventory-valuation.spec.ts` (6 tests) — **done 2026-07-20**; dev verification against a live DB was NOT performed (no DB in this session) — verify one real item with 3+ movement types manually before shipping
- [x] `code-review`: self-review pass done; no blocking findings — see notes below

## Implementation notes (2026-07-20)

1. **Both views load up front** (like purchases-by-item) so tab switching is instant; `view` seeds the initial tab and the print output.
2. **`txn_date` typed `string`** to match the `reports.ts` sibling convention (runtime value may be a JS Date or string; both are handled by `formatDatePdf`/`new Date()`).
3. **Print page uses `PrintReportLayout`** directly (no `+layout@.svelte` sibling file — none of the existing print routes have one; the layout carries the print CSS via `:global()`).
4. **`db.execute<T & Record<string, unknown>>`** — intersection satisfies postgres-js's generic constraint; keeps full row typing without `as` casts.
5. Known residual findings (all identical to sibling reports, pre-existing repo-wide):
   - 3 eslint findings in the main page (`svelte/prefer-svelte-reactivity` on `goto`'s URLSearchParams arg + `svelte/no-navigation-without-resolve` ×2) — same 5 findings exist in `purchases-by-item/+page.svelte`.
   - `svelte-check` repo baseline: 68 pre-existing errors in 29 files **none in the new files**.
6. Verification run (2026-07-20): `vitest run` → **17 files / 173 tests all pass** (incl. 6 new); eslint/prettier clean on new files; svelte-check 0 errors in new files.

## Related

- Shared PDF helpers: `src/lib/utils/pdf.ts` · conventions: `ai-docs/print-migration-tasks.md`
- Sibling pattern (filters + views + print): `src/routes/reports/purchases-by-item/*`, `ai-docs/…` sales/purchases specs
- Queries precedent (raw SQL + date idiom): `src/lib/server/db/queries/reports.ts`
- Stock write paths: `queries/{po,ibrrs,strs,fix-assets,sales-orders}.ts` (lines cited above)
- Contract: `PROJECT.md`
