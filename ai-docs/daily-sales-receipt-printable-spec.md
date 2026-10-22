# Daily Sales receipt printable — port to the jsPDF print trigger (form receipt, special case)

**For:** developer implementing the sales-delivery receipt rework; **user: a decision is needed before implementation (Q1).**
**Scope:** `src/routes/customers/daily-sales/print/[id]/*` only.
**Goal:** bring the sales-delivery receipt onto the jsPDF pipeline — **or keep it on browser print, knowingly, and say so** — ending this route's dependency on `window.print()` and its auto-print-on-mount.

Shared conventions apply except where this spec overrides: see `ai-docs/print-migration-tasks.md`.

## Why this one is special

Unlike the other seven routes, this page is **not a `PrintReportLayout` report** — it is a fixed-format sales-delivery receipt with its own layout and its own print path:

- **Auto-prints 300ms after mount** (`onMount → window.setTimeout(() => window.print(), 300)`) and also has a manual Print button — the only route that does that.
- No `PrintReportLayout`: custom `receipt-page` (letter, 8mm margins via `@page`), company box in Georgia serif, `SALES-DELIVERY RECEIPT` title with a Date/Sale No. reference table, **sold-to box** (min-height 35mm, uppercase), a right-aligned 4-col **payment table** (Check No. / Payment Method / Rep / Project), an **items table with forced empty filler rows** (min 8 data rows — `Math.max(0, 8 - order.items.length)`), totals box (Subtotal / optional Discount / bordered Total), and a **signature-over-printed-name box**.
- Two data queries in `+page.server.ts`: `getSalesOrder(id)` (404 if missing — the only print route with a real 404) and `getDailySalesPayment(id)`.
- Address text differs subtly from the report header (`MAGSAYSAY BLVD` / `CALBAYOG CITY, SAMAR` in receipt vs `MAGSAYSAY ST` / `CALBAYOG, PA 6710` in `createReportDoc`) — see Q3.

## ⚠️ Q1 — the blocking decision

The other routes get a branded RAM TECH report PDF. This receipt is a **fill-in paper form** (blank rows, signature box, mm-exact boxes) — the kind of document shops often want printed by a specific receipt/thermal or form printer.

| Option | What | For | Against |
|---|---|---|---|
| **A — port to jsPDF** (recommended if the user's printers are ordinary laser/office printers) | `buildSalesReceiptPdf(order, payment)` reproduces the form: header box, title, reference row, sold-to box (`rect` + text), payment grid, items grid with blank rows, totals box, signature box, via `openAndPrint` | one pipeline, `window.print()` gone everywhere, consistent footer/page numbers, testable | form fidelity must be hand-verified against the browser print; mm sizing becomes pt math |
| **B — keep browser print for this route only** | No change; the legacy path stays *documented as intentional*; Task 9's cleanup excludes this route and `PrintReportLayout` keeps its fallback | pixel-perfect form, zero risk | `window.print()` remains on a user-facing path; the "legacy path killed" milestone slips; auto-print stays |

**Do not start implementation until the user picks A or B.** If B: this file becomes the "known exception" entry in `ai-docs/print-migration-tasks.md` Task 9.

## Target design (Option A)

### Files

| File | Action | Contents |
|---|---|---|
| `src/routes/customers/daily-sales/print/[id]/pdf.ts` | **create** | `buildSalesReceiptPdf(order, payment): jsPDF` — hand-drawn form using `doc.rect`/`line`/`text` + one autoTable for items (grid theme); **no `createReportDoc`** (different header/title anatomy — reuse scaffolding only if it helps; the form, not the report frame, is the source of truth) |
| `+page.svelte` | **modify** | replace `onMount` auto-print with **no auto-print** (manual Print button wired to `openAndPrint`, like every other route — see Q2); keep the receipt HTML as the preview; keep the Back button |
| `+page.server.ts` | keep | — |

### PDF anatomy (mirroring the receipt HTML top-to-bottom)

1. Two-column header: company name in a 2pt box (Georgia not available in jsPDF standard fonts — `times` bold is the closest serif; note the substitution) + address lines left; `SALES-DELIVERY RECEIPT` centered right column + Date / Sale No. two-by-two mini grid.
2. **Sold-to box**: bordered rect (≈48% width × 35mm), `SOLD TO` label strip, customer name bold, address uppercase.
3. **Payment grid**: right-anchored 4-col × 2-row bordered grid: Check No. / Payment Method (title-cased `payment_type`, `_`→space, `—` when absent) / Rep (`staff.name`) / Project (blank).
4. **Items grid**: header Item / Qty / Rate / S/N / Amount with the exact column ratios of the preview (55/7/10/16/12%); ≥8 data rows — pad with empty rows exactly like the preview (`Math.max(0, 8 - items.length)`); qty/rate/amount right-aligned, `Php …` (convention 4); item text = `package?.name || product?.sales_description || '—'` (same fallback chain).
5. **Totals box** (right-anchored, ~40% width): Subtotal (sum of `total_price`), Discount `-Php …` only when > 0, ruled **Total** = `order.total_cost` (preview prints `order.total_cost`, not `subtotal - discount` — keep identical, flag if the two disagree in data).
6. **Signature box**: bordered rect 48% width, `SIGNATURE OVER PRINTED NAME`.
7. Footer: **report footer included** (`Generated on…` + page x of y) for reference — user decision Q4 (deviates from the spec's original "no" proposal).

### Decisions (user-confirmed 2026-10)

| # | Question | Decision |
|---|---|---|
| 1 | Port or keep browser print | **A — port to jsPDF** |
| 2 | Auto-print on mount | **Remove** — manual Print → `openAndPrint`, like every other route |
| 3 | Address text | Keep the **receipt's own text** (`MAGSAYSAY BLVD`, `CALBAYOG CITY, SAMAR`) |
| 4 | Report footer | **Yes — include** `Generated on…` + page x of y (reference purposes) |
| 5 | Font substitution | **helvetica everywhere** (the font used across all printables — no `times`) |

### Acceptance criteria (Option A)

1. Preview (receipt HTML) unchanged; Print button → branded receipt PDF with all six anatomy sections; **no `window.print()` and no auto-print on this route** (per Q2).
2. Box/grid positions match the preview in structure (same section order, same fields, same blanks where data is missing: `—` or empty as today).
3. `buildSalesReceiptPdf` runnable from plain Node; passing vitest: full order (3 items → 5 blank rows), 9 items (no blanks, no layout crash), payment missing → `—`, discount hidden when 0, long item names wrap.
4. `npm run check && npm run lint` clean.

## Verification

```
npm run dev
# /customers/daily-sales/print/1 → preview ≡ today; Print → new tab: form receipt, blank rows, signature box
# compare side-by-side with the old window.print output on the same order (PDF vs browser)
npm test -- daily-sales
npm run check && npm run lint
```

## Tasks

- [x] **USER DECISION Q1** — **A: port to jsPDF** (Q2 remove auto-print · Q3 keep receipt address · Q4 footer ON · Q5 helvetica)
- [x] `clean-code`: `pdf.ts` created (form anatomy 1–6); auto-print removed; Print button → `openAndPrint`
- [x] `tester`: `test/daily-sales-receipt-printable.spec.ts` (17 tests, green ×3); ⬜ **user side-by-side visual check** in `npm run dev` (signature-box height ≈20mm vs drawn 30pt, 15-line pagination, long rep names)
- [x] `code-review`: no 🔴 (minor notes: 40-char value clip in payment grid; signature box shorter than preview)

## Related

- Preview/source of truth: `src/routes/customers/daily-sales/print/[id]/+page.svelte`
- Data: `getSalesOrder` (`src/lib/server/db/queries/sales-orders.ts`), `getDailySalesPayment` (`src/lib/server/db/queries/daily-sales.ts`)
- Pipeline helpers: `src/lib/utils/pdf.ts`
- Exception registry: `ai-docs/print-migration-tasks.md` (Task 9) — record the Q1 outcome there
