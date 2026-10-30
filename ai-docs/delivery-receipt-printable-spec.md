# Delivery Receipt (D.R.) Printable — Spec

> **Status: READY — all open items resolved.** Implementation is **holding** until the 3 items in "Open items" land; then clean-code builds.

## Context

**Client request (2026-10-29):** a printable **Delivery Receipt** form for sales orders. The client supplied both (1) a reference image of the form (`static/380b4911-8113-48a2-86ec-d8359474bc6c.jpg`) and (2) a written description of the layout. The house print pipeline for this project is **jsPDF + `openAndPrint`** (server-rendered PDF in a new tab) — **not** CSS/`window.print()` — and this printable belongs in that pipeline.

**Predecessor work:** this is the **second** printable for the sales-order family (first: `ai-docs/daily-sales-receipt-printable-spec.md`) and sits next to the completed jsPDF reports (bills, packages, inventory, transfers, RMA, profit/loss, sales-by-rep/customer …). Its anatomy is a **form** (name/address box, D.R title + ref grid), which is why it must **not** reuse the `createReportDoc` scaffold the way the _reports_ do — the same call the sibling daily-sales receipt made. See **Target design** for the authoritative layout.

**What exists today:**

- The **daily-sales receipt printable** is the closest working analog: `src/routes/customers/daily-sales/print/[id]/` (`+page.server.ts` loads the order + payments, `+page.svelte` is the preview, `pdf.ts` builds the PDF and calls `openAndPrint`). The D.R. should follow that same route/shape pattern.
- Shared print helpers live in `src/lib/utils/pdf.ts`: `createReportDoc` (branded report scaffold), `openAndPrint`, `loadLogoDataUrl`, `addReportFooter`, `formatCurrencyPdf`, `safeNum`, `formatDatePdf`, and the shared style constants (`PDF_LABEL_COLOR`, `PDF_FOOTER_BAND`).
- The data already exists: **sales orders** with line items, customer, staff/reps. No new schema is required for v1 (see "Sales order data" below — the P.O. NO. field is the one gap the client expects).

## Problem

Sales-order delivery slips are currently not printed in the app. The client wants a **one-page D.R. form** — company header (RAM Tech Ventures Inc., logo + name + address), a `D.R` title with a small reference table (DATE / S.O. NO. / P.O. NO. / REP), a **Name/Address** box for the customer, an **item table** (item description, serial no., qty, unit price, total), a **sub-total + total** block, a **"FOR WARRANTY SERVICE"** paragraph, and three **signature-over-printed-name** blocks (Inventory / Received By / Branch Manager). It must be produced from a saved sales order and sent to the browser print pipeline.

## Constraints & Preferences (client + house rules)

- **Follow the existing print pipeline:** jsPDF + `openAndPrint` (new tab → browser print). **No** `window.print()` and **no** auto-print on this route (house rule, see `PROJECT.md` / `ai-docs/print-migration-tasks.md`).
- **House look & feel:** clean bordered boxes, small bold sans-serif (helvetica), black-and-white, single page, A4/Letter portrait. Reuse the shared helpers in `src/lib/utils/pdf.ts` rather than re-implementing currency/date/logo/footer.
- **Source is the sales order:** every field is prefilled from the saved order (customer, items, staff/rep, date). This is a **prefilled form**, not a blank fill-in sheet.
- **One company brand:** the form carries the **RAM Tech Ventures Inc.** identity (logo at top-left, company name/address in the header block). Do not mix in the secondary RAM Tech brand used elsewhere on the site.
- **One page:** the layout must fit a typical order on a single portrait page.
- **No payment table** unless the client confirms it (their spec lists the warranty paragraph and three signatures, not the check/payment grid the daily-sales receipt has).

## Target design (authoritative layout)

The layout is fixed by the client's reference image + description — **not** an open design choice.

**Page:** portrait, one page, white, black lines. Clean bordered boxes throughout; small bold sans-serif (helvetica).

**Header block (top):**

- `RAM TECH VENTURES INC.` — company name, boxed, **bold**.
- **Small logo, top-left** (company logo).
- `Bartolome Bldg., Magsaysay St. Blvd. / Brgy. East Awang Pob. / Calbayog City, Samar` — address lines under the name.
- Top-right: large **`D.R`** title (the form is titled “D.R”, not “SALES-DELIVERY RECEIPT”).
- Under the title, a **4-column reference grid**: **DATE · S.O. NO. · P.O. NO. · REP**, each cell bordered; REP = the staff name.

**Name/Address box (left, bordered):** `Name / Address` title bar + customer **name** (bold) and **address** below — prefilled from the order's customer.

**Items table (bordered):** columns **Item Description (widest) · Serial No. · Qty · UP · Total**; Qty / UP / Total right-aligned; currency as `Php …`; item name via the sibling's fallback chain (package name → sales description).

**Totals (right, bordered box):** exactly two rows — **SUB-TOTAL** and **TOTAL AMOUNT**. SUB-TOTAL = `Σ items.total_price`; TOTAL AMOUNT = `order.total_cost`. (No discount row in this form.)

**Warranty block (centered, bordered):** heading **`FOR WARRANTY SERVICE:`** followed by the client's warranty paragraph (see **N0** — exact wording below).

**Signatures (3 blocks, bottom):** each shows a line, the label **“Signature over Printed Name”**, and the role beneath:

- **Inventory** (left)
- **Received By** (right)
- **Branch Manager** (centered, on the row below the first two)

> **Layout fidelity note (D-1):** the client explicitly described a **form layout** (boxed Name/Address, `D.R` title + ref grid, warranty paragraph, three signatures), _not_ the branded report grid. Do **not** reuse `createReportDoc`'s heading/label grid for this — hand-draw the form anatomy in `pdf.ts`, the same call the daily-sales receipt spec made. The shared _helpers_ (`formatCurrencyPdf`, `openAndPrint`, `loadLogoDataUrl`, `addReportFooter`) are still used.

## Sales order data (what the printable reads)

- **Source of truth:** the saved **sales order** + its **items** + the linked **customer** and **staff/rep**. Loading route: mirror the sibling — `getSalesOrder` (`src/lib/server/db/queries/sales-orders.ts:160`) returns `order`, `customer` (name/address), `staff` (name), `items`, each item with `product` (`sales_description`) and `package` (`name`) — i.e., everything except P.O. NO. is available **today, no new query needed**.
- **Money:** `items[].unit_price` / `total_price`, `order.total_cost` (sub-total is derived as `Σ total_price`). Format with the shared `formatCurrencyPdf` (`Php …`, no peseta glyph).
- **Dates:** `order.date_ordered` (`2026-09-11T00:00:00.000Z` in the sample) → `formatDatePdf` (`en-US` long date).
- **ID:** `order.id` (e.g., `2`) → the **S.O. NO.** cell. **P.O. NO.** has **no source yet** (no column in `sales_orders`) — left blank or added (see **Q1**).
- **Rep:** `order.staff_user_id` → staff name → **REP** cell.
- **Warranty text:** this is **static form copy** owned by the client, not per-order data. Store it as a single string constant in `pdf.ts` (see **N0**) so it is easy to edit / localize and is asserted verbatim in tests.

**Schema (for reference — no changes expected for v1):** `sales_orders` (`id, created_at, date_ordered, order_status, total_cost, discount, customer_id, staff_user_id, notes`, FKs to `customers`/`users`), `sales_order_items` (`id, sales_order_id, product_id, package_id, quantity, unit_price, total_price, notes, serial_number`). No `po_number` column exists.

## Existing behavior / patterns to keep

- **Pipeline:** new jsPDF doc → `openAndPrint(doc)` in a new tab → browser print. **No** CSS `window.print()`, **no** auto-print (house rules).
- **Sibling to clone (route shape + style):** `src/routes/customers/daily-sales/print/[id]/` — `+page.server.ts` (load order + payments) → `+page.svelte` (preview) → `pdf.ts` (`buildSalesReceiptPdf` + `openAndPrint`). The D.R. drops the payment table and swaps in the Name/Address box + `D.R` title/ref grid + warranty + three signatures.
- **Shared helpers:** `src/lib/utils/pdf.ts` — `createReportDoc` (report scaffold; **not** for this form), `openAndPrint:27`, `loadLogoDataUrl:48`, `addReportFooter`, `formatCurrencyPdf`, `safeNum`, `formatDatePdf`, `PDF_LABEL_COLOR`, `PDF_FOOTER_BAND`.
- **Conventions:** `PROJECT.md`, `ai-docs/print-migration-tasks.md`, `ai-docs/print-headers-logo-spec.md`.

## Success criteria (definition of done)

1. **New route** `GET /customers/sales-orders/{id}/print` **renders a preview** that mirrors the Target design (header block, Name/Address box, item table, SUB-TOTAL/TOTAL, warranty block, three signatures).
2. **Print action** → `openAndPrint` → **one page** (typical order) with all Target-design elements in their described positions/boxes.
3. **All fields prefilled** from the sales order (customer name/address, item list, qty/UP/total, SUB-TOTAL, TOTAL AMOUNT, date, S.O. NO., REP).
4. **P.O. NO.** handled **consistently** per whatever the user decides in **Q1**.
5. **Three signature blocks** each show “Signature over Printed Name” + role (Inventory / Received By / Branch Manager).
6. **No console / runtime errors; clean build.** `npm run check` (SvelteKit type-check) and the lint gate pass.
7. **No regression** to other printable routes or the existing reports — existing tests still green.
8. **Preview ≡ print:** the on-screen preview and the jsPDF render are the same layout (parity is the acceptance standard).
9. **One-page guarantee** for the canonical fixture (≤ ~8 line items); longer orders flow to a second page cleanly (no overlapping text).
10. **`npm run dev` + manual print** on at least one real sales order matches the client's reference image in structure.

## Open items (block the build)

> **D-2 — resolve these with the user before `clean-code` runs. The spec is otherwise final.**

| #      | Question                                                                                                                                  | Options                                                                                                                                                                 | Recommended default (if silent)                                                                            |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Q1** | **P.O. NO.** — the form has a P.O. NO. cell but there is **no source** (no `po_number` on `sales_orders`).                                | (a) print **blank** (cell only); (b) **add a `po_number` column** + a form field on the sales order; (c) let the user type it at print time as a query param (`?po=…`). | (a) blank — smallest, matches "the client expects the cell but data may not exist yet"                     |
| **Q2** | **Prefilled vs blank form** — is the D.R. a _prefilled slip from the order_ (my default) or a _blank fill-in form_ the staff hand-writes? | (1) prefilled (default); (2) blank template only                                                                                                                        | (1) prefilled — every field already has a source in the order                                              |
| **Q3** | **Excel / spreadsheet export?** The client also asked "Can you also do a sample of the Excel?" — is that in scope for this pass?          | (in/out of scope)                                                                                                                                                       | Out of scope this pass; it does not fit the jsPDF + `openAndPrint` pipeline and the request is unconfirmed |

### Notes (for reviewers & the user, not blockers)

- **N0 — EXACT WARRANTY WORDING (client-supplied 2026-10-29), store as a single string constant unchanged:**

  > `RAM TECH VENTURES INC. is offering a Standard Warranty for it's Major products. When seeking diagnose from RAM TECH VENTURES INC. authorized technician, present this warranty delivery slip and a copy of your PROOF OF PURCHASE: Sales Invoice, Delivery Slip, Change Invoice or Office Receipt together with the faulty equipment. During the applicable warranty period, RAM TECH VENTURES INC. at it's parts: PROCESSOR, MOTHERBOARD, RAM, SSD, HDD, PRINTER, UPS, MONITOR, POWER SUPPLY, DVR, NVR, ANALOG CAMERA, IP CAMERA, will repair such equipment charge at shipment charge only. Defective equipment, accessories and spare parts shall become RAM TECH VENTURES INC. properly. Replaced equipment and spare parts are warranted for the balance of the applicable warranty period.`

  Do **not** reword or "fix" this (it appears to be the client's own copy, including any spelling).

- **N1 — `D.R` vs `SALES-DELIVERY RECEIPT`:** the reference image shows `D.R` top-right. Print the form title as **`D.R`** (per image), not the long "SALES-DELIVERY RECEIPT" the description text used. Flag if the client actually wants the long title.
- **N2 — Address spelling:** image says `Bartolome Bldg., Magsaysay St. Blvd.` — match the address text exactly against the client's own branding (the site's `RAM Tech` address may differ); use the **RAM Tech Ventures Inc.** address as the canonical one in `pdf.ts`.
- **N3 — No payment table** in the client's spec (unlike the daily-sales receipt). If the client wants Check No./Payment Method on the D.R., that is a follow-up.
- **N4 — No logo image confirmed for the D.R.** header yet — reuse `/ramtech-logo.jpg` (`LOGO_PATH`) for v1; swap if the client supplies a specific D.R. stamp/logo.

## Acceptance criteria (testable)

1. `GET /customers/sales-orders/{id}/print` renders a preview that mirrors the Target design; wrong/missing id → `404`.
2. Print → branded D.R. PDF via `openAndPrint`; **no `window.print()` and no auto-print on this route**.
3. All fields prefilled from `getSalesOrder`; SUB-TOTAL = Σ `total_price`, TOTAL AMOUNT = `total_cost`; blank/missing values render as `—`/empty.
4. `buildDrPdf` runnable from plain Node (no DOM); vitest green: a 3-item order, a 15-item order (all lines render), missing customer/staff/serial → safe fallbacks, long item names wrap, totals after items, warranty + three signature blocks present.
5. `npm run check` clean for changed files; lint gate passes.
6. **WYSIWYG parity:** on-screen preview and PDF show the same sections in the same order.

## Verification (manual)

```
npm run dev
# 1. Open a sales order: /customers/sales-orders/1
#    → detail page shows a Print button → /customers/sales-orders/1/print
# 2. Print → new tab: D.R form (one page)
# 3. Compare side-by-side against the client's reference image (static/380b4911-….jpg)
npm test -- delivery-receipt
npm run check
```

## Tasks

- [x] **USER:** exact warranty copy supplied (N0) · **Q1 P.O. NO. = blank** · **Q2 = prefilled** · Q3 Excel out of scope
- [x] **clean-code:** `+page.server.ts` + `pdf.ts` + `+page.svelte` + `+layout@.svelte` (skips the customers SubHeader — same house pattern as bills/packages print); Print button on the SO detail page
- [x] **tester:** `test/delivery-receipt-printable.spec.ts` (mirrors `test/daily-sales-receipt-printable.spec.ts`) — 14 tests green — ⬜ **user visual check** against the client image
- [x] **code-review:** anatomy fidelity confirmed, no 🔴 (two 🟡 WYSIWYG fixes applied in the preview CSS)

## Related

- Closest sibling (pattern + house decisions): `src/routes/customers/daily-sales/print/[id]/`, `ai-docs/daily-sales-receipt-printable-spec.md`
- Data: `getSalesOrder` — `src/lib/server/db/queries/sales-orders.ts:160`
- Schema: `salesOrders`/`salesOrderItems` — `src/lib/server/db/schema.ts:320` / `:338`
- Pipeline helpers: `src/lib/utils/pdf.ts` (`openAndPrint:27`, `loadLogoDataUrl:48`, `LOGO_PATH:166`)
- Conventions: `ai-docs/print-migration-tasks.md`, `ai-docs/print-headers-logo-spec.md`
