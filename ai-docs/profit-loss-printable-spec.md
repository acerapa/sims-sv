# Profit & Loss printable — port to the jsPDF print trigger (dynamic months + by-product table)

**For:** developer implementing the profit & loss print rework; reviewer verifying it.
**Scope:** `src/routes/reports/profit-loss/print/*` only.
**Goal:** replace the legacy `window.print()` trigger with the jsPDF pipeline for all three views — overall totals row, dynamic monthly breakdown (one column per invoiced month), and the by-product table.

Shared conventions 1–11 apply: see `ai-docs/print-migration-tasks.md`.

## Background / today

- `+page.server.ts`: `?from=&to=&view=` (default `summary`); `Promise.all` of `getProfitLossSummary`, `getProfitLossMonthly` (skipped in `detail`), `getProfitLossDetail` (skipped in `summary`).
- **Summary** = (a) an **Overall Totals** strip: Total Income / COGS / Gross Profit / Gross Margin % (inline 4-up div); (b) a **transposed table** — rows are `Income`, `Cost of Goods Sold` (bold), footer rows `Gross Profit` + `Gross Margin %` (small gray) — **columns = months** (`YYYY-MM` formatted `Month YYYY`, + a `Total` column when > 1 month).
- **Detail** = By Product: 7-col table — SKU (mono, small), Product, Qty Sold, Revenue, Cost, Profit, Margin % — + Total `tfoot` row with total margin.
- `view === 'both'`: summary, page break, `By Product` heading, detail.
- All money strings parsed with `parseFloat`; margin % helper is `profit / income × 100` at one decimal, `0.0` when income is 0.
- Titles: `Profit & Loss` / `… — Summary` / `… — By Product`.

## Target design

### Files

| File                                                | Action     | Contents                                                                                                                                                                                                                                                                            |
| --------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes/reports/profit-loss/print/pdf.ts`       | **create** | `buildProfitLossPdf(data, { view }): jsPDF`; pure helpers `formatMonthPdf(monthStr)`, `grossMarginPct(income, profit)`; move the component's `formatCurrency`/`grossMarginPercent` out into shared pure formatters the preview also imports (single source of truth, Node-testable) |
| `src/routes/reports/profit-loss/print/+page.svelte` | **modify** | wire `onPrint`; import the shared formatters (preview output unchanged)                                                                                                                                                                                                             |
| `+page.server.ts`                                   | keep       | —                                                                                                                                                                                                                                                                                   |

### PDF format

`createReportDoc({ title, subtitle: <date range> })`, from `startY`:

1. **Overall totals** (when summary): one compact table, 5-col — `Total Income`, `COGS`, `Gross Profit`, `Gross Margin %`, values bold right — or a 2×2 label/value block; _keep visual equivalence with the preview's 4-up strip_ (label bold, value after it). Simplest faithful rendering: two rows of label/value pairs in one column-width autoTable with no grid lines (`theme: 'plain'`).
2. **Monthly breakdown (autoTable)** — dynamic head: first cell blank, then one col per `monthly[].month` formatted `formatMonth` (e.g. `July 2026`), + `Total` col iff `monthly.length > 1` (today's exact rule). Rows: `Income`, `Cost of Goods Sold` (bold via `rowStyles`); foot: `Gross Profit` (bold), `Gross Margin %` (smaller, gray `textColor [102,102,102]` — mirrors the `#666` style). All money `Php …`. Column widths: label col fixed (~110pt), remaining width split evenly across month cols.
   - Empty → centered `No invoice data found for the selected date range.` (today's text).
   - **Overflow guard**: if months would push columns past the printable width (e.g. >8 months), keep helvetica 9pt shrinking to min 7pt; if still too wide, log a dev-warning comment and let cells wrap (`overflow: linebreak`) — flag actual overflow in the test with a 12-month fixture. _(If the user prefers an orientation flip for wide ranges, that's a Q1 decision — see below.)_
3. **Detail (autoTable, `view` detail/both)** — head `[SKU, Product, Qty Sold, Revenue, Cost, Profit, Margin %]`; SKU col fixed ~70pt, Product flexible, rest right; empty state text as today; foot row `Total` (colSpan 2) + totals + total margin — values from the preview's `detailTotals`.
4. `both`: page break + `By Product` heading between, exactly as preview.
5. `addReportFooter(doc)`.

### Decisions

| #   | Question                        | Decision (user-confirmed 2026-07)                                                                                                                                                                                                                                                                                                                                 |
| --- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Wide monthly range (12+ months) | **Landscape** when the monthly table would have **more than 8 month-columns**; portrait otherwise. Orientation applies to the whole document (so `both` view is consistently landscape). Still wrap cells if a column is too narrow. Consolidation of PDF helpers into `$lib/utils/pdf.ts` is a **separate future spec task** — do not do it as part of this one. |
| 2   | Where the pure formatters live  | `pdf.ts` exports; preview imports (keeps `$lib/utils` untouched and the builder self-contained) — user-confirmed                                                                                                                                                                                                                                                  |

### Acceptance criteria

1. All 3 views print branded PDFs; month headers, per-month columns, `Total` column rule (>1 month), margins all ≡ preview values (compare one real range's numbers side by side).
2. Moving the formatters to `pdf.ts` leaves the **preview output identical** (same strings, same rounding to 1 decimal).
3. `buildProfitLossPdf` runnable from plain Node; passing vitest: 1-month summary (no Total col), 3-month summary (Total col), zero-income margin → `0.0%`, empty monthly, empty detail, 12-month wide fixture, `both` page-break.
4. `npm run check && npm run lint` clean.

## Verification

```
npm run dev
# /reports/profit-loss/print?view=summary with a range covering 1 month and one covering 3+
# ?view=detail and ?view=both likewise → Print → branded PDF, totals ≡ preview
npm test -- profit
npm run check && npm run lint
```

## Tasks

- [x] **user decision Q1** (wide-range strategy → landscape > 8 month-cols) · Q2 (formatter location → `pdf.ts` exports, user-confirmed)
- [x] `clean-code`: created `pdf.ts` + shared formatters; preview now imports them; `onPrint` wired (empty-state full-width fix in fix loop 1/2)
- [x] `tester`: `test/profit-loss-printable.spec.ts` (16 tests, suite 81/81, 3× green) — **live `npm run dev` check still pending on the user**
- [x] `code-review`: ✅ approve, 0 🔴/🟠 (🟡: `drawMonthlyTable` length; ⚪: totals-strip value alignment)

## Related

- Shared: `src/lib/utils/pdf.ts`
- Data: `getProfitLossSummary` / `getProfitLossMonthly` / `getProfitLossDetail` in `src/lib/server/db/queries/reports`
- Preview being refactored: `src/routes/reports/profit-loss/print/+page.svelte`
