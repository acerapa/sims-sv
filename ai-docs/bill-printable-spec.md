# Spec — Print Bill (jsPDF)

**Route:** `src/routes/vendors/bills/` — the "View Bill" sheet (`BillForm.svelte`) currently has **no print button**.
**Goal:** from a viewed bill, one Print button → standard repo print pipeline (preview tab + jsPDF).

## What "View Bill" shows today (source of truth for print content)

`BillForm.svelte` (view mode, `bill` prop set, `edit=false`) renders:

1. **Bill Details:** Supplier, Linked PO (reference), Bill Date, Due Date, Notes
2. **Items:** rows from the linked PO — `Product | Quantity Received | Unit Cost | Total`, then `Subtotal / Discount (₱) / Total` (values from `purchase_orders`)
3. **Payment Details:** Payment Method (Cash/Check), Check Number (when check), Amount (`paid_amount`)
4. List row shows: `BILL-00{id}`, status (`partial`|`paid`), `total_amount`, `paid_amount`

Data available: `getBill(id)` (bills + supplier name + PO reference) already exists in `src/lib/server/db/queries/bills.ts`; PO items/totals come from `getPOBySupplierId(supplierId)` (joins `purchase_orders` + `purchase_order_items` + `products`).

## Existing conventions (mandatory — `ai-docs/print-migration-tasks.md`)

- Builder file per route: `.../print/[id]/pdf.ts`, `buildBillPdf(data): Promise<jsPDF>`, no Svelte/`$lib` imports except `$lib/utils/pdf.ts`
- `createReportDoc({ title, subtitle? })` → content from `startY` → `addReportFooter(doc)`
- Currency = **`Php 12,345.67`** in PDF (`formatCurrencyPdf`); preview uses `formatCurrency` from `$lib/utils/common`
- autoTable defaults: `theme:'grid'`, helvetica 9, dark head/foot text, right-aligned numerics
- Preview wraps in `PrintReportLayout` with `onPrint={async () => openAndPrint(buildBillPdf(data))}`
- Tests: `test/bills-printable.spec.ts`, jsPDF-4 literal extraction (regex on raw stream, see `test/ibrr-printable.spec.ts`)
- Trigger opens new tab: `window.open(`/vendors/bills/print/${id}`, '_blank')` (precedent: `vendors/inventory/+page.svelte:114`)

## Target design — files

| File | Change |
|---|---|
| `src/lib/server/db/queries/bills.ts` | add `getBillWithItems(billId)`: `getBill` fields + PO `sub_total/discount/total` + `po_items[]` (`name, quantity, cost, total_cost`) via the same joins as `getPOBySupplierId`, filtered to the bill's `purchase_order_id` |
| `src/routes/vendors/bills/print/[id]/+page.server.ts` | load `getBillWithItems(parseInt(id))`; 404 when missing |
| `src/routes/vendors/bills/print/[id]/pdf.ts` | `buildBillPdf(bill)` — layout below |
| `src/routes/vendors/bills/print/[id]/+page.svelte` | `PrintReportLayout` preview matching the PDF 1:1 |
| `src/lib/components/pages/vendors/bills/BillForm.svelte` | view mode only (`bill && !edit`): **Print** button in the sheet header next to `Edit Bill` → `window.open` the print route |
| `test/bills-printable.spec.ts` | literal-text assertions (title, bill no, supplier, item rows, `Php` totals, balance) |

## PDF layout (portrait)

```
[brand header — createReportDoc: logo, company box]
Bill                          BILL-00{id}   ·   {status capitalized}
<ruled title band>

Supplier:        {supplier_name}
Linked PO:       {po_reference}
Bill Date:       {long date}            Due Date: {long date}
Notes:           {notes or '—'}

Items (autoTable, grid, showHead everyPage):
  Product            | Qty | Unit Cost        | Total
  {name}             |  12 | Php 1,250.00     | Php 15,000.00
  ...

                                     Subtotal      Php 15,300.00
                                     Discount      Php    300.00
                                     Total         Php 15,000.00
                                     Amount Paid   Php  4,000.00
                                     Balance       Php 11,000.00

Payment:  {Cash | Check (No. {check_number})}

[footer — addReportFooter: generated on, page numbers]
```

- Empty `po_items` → single centered row `No items on this purchase order` (empty-state convention, never a blank table)
- `Balance = total − paid_amount` (defensive `parseFloat`, floor at 0)
- Numeric columns right-aligned; long `name` column gets `cellWidth` + `linebreak`

## Decisions — APPROVED by user

1. Button placement: **a** — Print button in the *View Bill* sheet header, next to *Edit Bill* (not on list-row dropdowns)
2. Print content: **a** — full bill: header + PO item lines + subtotal/discount/total, mirroring the View sheet
3. Balance: **a** — show `Balance = Total − Amount Paid` (floored at 0) in the totals block

## Acceptance criteria

- View sheet (any bill, any status) has a Print button in view mode — hidden in Add/Edit mode
- Print tab renders a preview ≡ the PDF (WYSIWYG by construction — same pure data transform)
- PDF opens in the print dialog with: bill no, supplier, PO ref, both dates, notes, items, subtotal/discount/total, paid, balance, payment method (+ check # when check)
- `test/bills-printable.spec.ts` passes; full `vitest run` stays green
- No changes to bill create/update actions or any product/quantity write path

## Verification

1. `npm run check && npm run lint` clean on touched files
2. `npx vitest run` green
3. Manual: Vendors → Bills → any bill → View → **Print** → preview → PDF; compare against the sheet contents

## Implementation notes (as-built)

- `getBillWithItems(billId)` reuses `getBill` (throws 404-style error when missing), then reads PO totals and item lines (drizzle `innerJoin`, items ordered by product name)
- `BillPrintData` in `pdf.ts` deliberately includes BOTH `total` (PO total) and `total_amount`/`paid_amount` (bill fields) — the sheet bills the PO total but books the entered amount; Balance floors at 0
- `print/[id]/+layout@.svelte` replaces the vendors layout so the print tab renders without the SubHeader bar (same pattern as every other nested print route)
- Preview page accesses `page.data` from `$app/state` — NO `$page` store syntax (Svelte 5 would compile it as `store_get` → SSR 500)
- Totals block drawn as a plain-theme autoTable (labels left, values right, Total/Balance bold) in the right half of the page, mirroring the preview's half-width block
- jsPDF escapes parentheses in content streams — tests assert `Check \(No. 22913\)` (raw bytes) like the other spec files assert raw `Tj` text
- `BillForm.svelte` view header: Print (outline, icon) + Edit Bill; `@const billId` avoids the Svelte 5 possibly-null closure complaint (kept svelte-check at the file's 18-error baseline)
- Incidental fix: bills page title typo `Billss` → `Bills`
- Live-DB verified: bill 2 (MB Suppliers, PO-098717, partial, 3 lines) renders header, items, currency and Balance through both the query and the PDF builder (auth guard 302s anonymous curl identically on all routes, incl. the shipped inventory-valuation print route)
- Gates: vitest 178/178, eslint clean, prettier clean, svelte-check 0 new errors
