# Fix Asset printable — new jsPDF print route + form-sheet trigger

**For:** developer implementing the Fix Assets print feature; reviewer verifying it.
**Scope:** `src/routes/vendors/transfers/fix-assets/print/[id]/*` (new) + the Print trigger in `src/lib/components/pages/vendors/transfers/fix-assets/fix-assets-form.svelte`.
**Goal:** give Fix Assets a first-class print, matching the STR/IBRR siblings — branded preview page inside `PrintReportLayout` plus a jsPDF builder (`openAndPrint`), triggered by a Print button in the form sheet.

Shared conventions 1–11 apply: see `ai-docs/print-migration-tasks.md`. This spec lists only the Fix Asset–specific design.

## Confirmed decisions (user, 2026-10-22)

| # | Decision | Chosen |
|---|---|---|
| D1 | Document reference prefix | `FIX-{id}` |
| D2 | `staff_user_id` | **excluded** from the document (it is captured on the record, just not printed) |
| D3 | Items table | Same as STR — `Product, SN, Qty, Cost, Total Cost` with multi-serial fan-out (one line per serial at qty 1) |
| D4 | Header fields | `TRANSFER DATE` and `USER` as label fields, plus the `NOTES` box |
| D5 | Trigger | Print button **in the form sheet** (IBRR pattern, `IBRRForm.svelte:89`) |
| D6 | Print pipeline | Preview + jsPDF `openAndPrint`; no `window.print()` (fallback already removed — `onPrint` is a required prop, `src/lib/components/common/PrintReportLayout.svelte:15`) |

## Background / today

- **No print exists for Fix Assets** — the sibling transfer routes all have `print/[id]` (`strs`, `ibrrs`, `rmas`); this route must be created, not migrated.
- Trigger pattern to copy: `IBRRForm.svelte:63-64` (`goto(resolve('/vendors/transfers/ibrrs/print/${id}'))`) with the button rendered only when a record is open (`{#if ibrr?.id}`, `IBRRForm.svelte:88`).
- Data already exists: `getFixAssetById` in `src/lib/server/db/queries/fix-assets.ts:30` returns `{ id, date_transfered, user, notes, items }`; items are grouped per product with serials accumulated in `serial_numbers` (`groupItemsByProduct`, `fix-assets.ts:130`).
- `FixAssetItem` is shape-identical to `STRItem` (`src/lib/types/global.ts:207-210`), so the STR serial expansion applies unchanged.
- `user` is an enum label (`FixAssetUser`, `src/lib/const.ts:21`) — display it capitalized, as the list does (`capitalizeFirstLetter`, `+page.svelte` row cell).
- The list table already shows `FA-{id}` in its No. column (`src/routes/vendors/transfers/fix-assets/+page.svelte`, No. cell). The printed document uses `FIX-{id}` per D1; the list column is left untouched (follow-up, below).
- **Quirk (out of scope, reviewer-aware):** `groupItemsByProduct` pushes the *first* row's serial onto a group it already holds (`fix-assets.ts:137`) and re-derives `total_cost = cost × quantity`. WYSIWYG rule (convention 8) still holds — the PDF mirrors whatever the preview renders — but the data itself is suspect and should be a separate bug ticket.

## Target design

### Files

| File | Action | Contents |
|---|---|---|
| `src/routes/vendors/transfers/fix-assets/print/[id]/+page.server.ts` | **create** | `load`: `getFixAssetById(Number(params.id))` → `{ fixAsset }`. No 404 — matches siblings (`ibrrs/print/[id]/+page.server.ts`), page guards with `fixAsset?.` |
| `src/routes/vendors/transfers/fix-assets/print/[id]/+page.svelte` | **create** | Preview: `PrintReportLayout` (`reportTitle` + `onPrint` required) with the label rows, notes box, and STR-shaped items table |
| `src/routes/vendors/transfers/fix-assets/print/[id]/+layout@.svelte` | **create** | Standalone layout importing `app.css` (six `..` — copy `strs/print/[id]/+layout@.svelte`) |
| `src/routes/vendors/transfers/fix-assets/print/[id]/pdf.ts` | **create** | `expandFixAssetItems(items): rows` (pure, STR `expandStrItems` logic, `strs/print/[id]/pdf.ts:47`) + `buildFixAssetPdf(fixAsset): jsPDF` |
| `src/lib/components/pages/vendors/transfers/fix-assets/fix-assets-form.svelte` | **modify** | Print button in the "Fix Asset Information" `CardHeader`, rendered only when `fixAsset?.id` — copies `IBRRForm.svelte:63-64,88-92` (`Printer` icon, `variant: outline`, `goto(resolve('/vendors/transfers/fix-assets/print/${id}'))`) |

### PDF format

`createReportDoc({ title: '<report title — see Q1>' })`, then top to bottom (mirrors STR's `pdf.ts`):

1. **Label rows** (LABEL 7pt bold #666 over value 10pt, muted underline): row 1 `FIX REFERENCE NO.` (FIX-`{id}`) / `TRANSFER DATE` (en-US `January 5, 2026` style, same `formatDatePdf` as STR); row 2 `USER` (capitalized enum value, e.g. `Technician`).
2. **NOTES** wrapped block (`doc.splitTextToSize`, `---` when empty) — same `drawNotes` as STR.
3. **Rule + items heading** (mirrors `<p>` + `<hr>` in the preview).
4. **autoTable** items: head `[Product, SN, Quantity, Cost, Total Cost]`; body from `expandFixAssetItems(items)` — SN `'' → '--'`; Qty/Cost/Total right-aligned, `Php …` (no ₱ glyph, convention 4); Product free width with `overflow: 'linebreak'`; empty → single centered row (wording per Q2).
5. `addReportFooter(doc)`.

### Decisions (need user confirm)

| # | Question | Proposed |
|---|---|---|
| 1 | Report title (`createReportDoc` title + `PrintReportLayout reportTitle`) — siblings use `Stock Transfer Report` / `Inter-Branch Receiving Report` | `Fixed Asset Transfer` |
| 2 | Items heading + empty-state wording | Heading `Items Transferred`; empty row `No items found for this Fix Asset.` in **both** preview and PDF |

### Acceptance criteria

1. Preview and PDF show identical content and order (convention 8): FIX ref + transfer date, user, notes (`---` when empty), items table with the same STR-shaped rows.
2. Print → branded PDF with header, all label fields, items autoTable, footer on every page — **no `window.print()` path**.
3. Multi-serial item (N serials) → N lines of qty 1 in both preview and PDF, same as STR.
4. Print button appears in the form sheet **only** when viewing an existing fix asset; hidden in "Add" mode.
5. `expandFixAssetItems` + `buildFixAssetPdf` runnable from plain Node; passing vitest (empty items, single item, multi-serial fan-out, long product names wrap, empty notes → `---`).
6. `npm run check && npm run lint` clean on touched files.

## Verification

```
npm run dev
# Fix Assets list → View any record → Print → new tab: branded PDF, FIX-#### ref, user, date, items table
npm test -- fix-assets
npm run check && npm run lint
```

## Tasks

- [ ] `clean-code`: create the four `print/[id]` files; add the form-sheet Print button (IBRR pattern)
- [ ] `tester`: `test/fix-assets-printable.spec.ts` (builder + expansion, per acceptance 5); dev check of the printed Fix Asset
- [ ] `code-review`: diff, no 🔴

## Not covered (and why)

- `staff_user_id` on the document — explicitly excluded per D2.
- The `groupItemsByProduct` quirk (`fix-assets.ts:130-147`) — pre-existing data behavior; WYSIWYG keeps preview ≡ PDF; needs its own bug ticket.
- Renaming the list's `FA-{id}` No. column to `FIX-{id}` — left untouched; flag below if the mismatch becomes a problem.

## Follow-ups the user may want

- Align the list No. column (`FA-{id}`) with the printed `FIX-{id}` reference.
- Log a ticket for the `groupItemsByProduct` serial/total quirk.
- Add a row to the `ai-docs/print-migration-tasks.md` task board noting Fix Assets as a **new** (not migrated) jsPDF route.

## Related

- Shared: `src/lib/utils/pdf.ts` (`createReportDoc`, `addReportFooter`, `openAndPrint`) · Layout: `src/lib/components/common/PrintReportLayout.svelte`
- Nearest same-shape spec: `ai-docs/str-printable-spec.md` · Table pattern: `src/routes/vendors/inventory/print/pdf.ts`
- Data: `src/lib/server/db/queries/fix-assets.ts` (`getFixAssetById`) · Types: `FixAssetItem` in `src/lib/types/global.ts:207`
- Test precedent: `test/str-printable.spec.ts` (builder + expansion, raw-stream text assertions)
