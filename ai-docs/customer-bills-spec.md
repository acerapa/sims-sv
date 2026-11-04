# Customers › Bills — customer payment tracking (accounts receivable)

## Why

The vendor side already has **Bills** (`/vendors/bills`): bills track what we **owe** suppliers against a PO.
The request (client, 2026-11): "create one as well under customers — this one will focus on the sales
side. Instead of PO we are tracking the payment from the invoices or SO. We do have received payments
from the invoice directly but for this, it's just for easy access."

So `/customers/bills` is the **read-only accounts-receivable ledger**: one easy-to-reach list of every
customer bill (invoice) with what has been paid and what is still outstanding. Payment entry itself
stays where it already is — the invoice detail page — and this page links there.

## Route + navigation

| Item  | Path                                                                               |
| ----- | ---------------------------------------------------------------------------------- |
| Route | `src/routes/customers/bills/` — `+page.server.ts`, `+page.svelte`, `+page.ts`      |
| Nav   | `src/lib/components/pages/customers/sub-headers.svelte` — "Bills" after "Invoices" |
| Title | `Bills` / "Track payments received against customer invoices."                     |

## Data — read-only, no new table, no actions

New query `getCustomerBills()` in `src/lib/server/db/queries/invoices.ts`:

- `invoices` (non-`cancelled`) ⋈ `sales_orders` ⋈ `customers`
- columns: invoice id, customer name, linked SO id, invoice date, due date, status, total, paid
- post-processing (JS, unit-tested): `balance = max(0, total − paid)`
- ordered by due date (most urgent first)

Returned row type: `CustomerBillRow` (string amounts as the DB returns them + numeric `balance`).

## UI (mirrors `vendors/bills` + `customers/invoices` card conventions)

- Card "Bills" / "Track payments received against customer invoices."
- Search input — filters by customer name client-side (same as the Invoices page)
- Table columns: Invoice No. (`INV-00{id}`) · Customer · SO (`SO #{id}`) · Invoice date · Due date ·
  Total · Paid · Balance · Status (badges reusing the Invoices page variants) · Actions
- Actions: **Open invoice** → `/customers/invoices/{id}` (view details **and** record payment there)
- Empty state: "No bills found!"
- **No create/update form, no DB writes** — this page never mutates anything

## Print

Not in v1 — an invoice printable already exists. Candidate follow-up: a customer-bill printable
cloning `vendors/bills/print/[id]`.

## Tests

`test/customer-bills.spec.ts` using the house `vi.mock('../src/lib/server/db')` builder pattern
(same as `test/sales-by-rep.spec.ts`):

1. maps a full row — customer name, amounts, `balance = total − paid`
2. clamps `balance` to 0 when an invoice is overpaid
3. returns an empty list when there are no non-cancelled invoices
4. the page load passes the bill list through

Gates: prettier / eslint / svelte-check clean on new files; full vitest suite green.

## Open questions (defaults chosen — raise a hand to change before/after build)

1. **Read-only?** — default: yes. Payment entry stays on the invoice page; the bill page deep-links to it.
2. **Cancelled invoices?** — default: excluded from the ledger (nothing is owed on a cancelled bill).
3. **SOs with no invoice yet?** — default: not listed (payment data lives at invoice level; an uninvoiced SO has no bill to track).
4. **Printable in v1?** — default: no (invoice printable exists).
