# Spec — Customer Bills: Add Bill / Record Payment form (Option A)

**Owner:** conductor · **Requested by:** user 2026-11
**Gate:** user selected **A** — reuse the customer **Invoice + Payment** model. No new table, no `updateInvoice`.

## Intent

Give `/customers/bills` the same form UX as `/vendors/bills`: an **"Add Bill"** sheet (header) and a per-row **"View / Record Payment"** sheet — but it points at a **customer + sales order** (instead of supplier + PO) and writes to the existing customer money model:

- create → `createInvoice` (invoice + items snapshotted from the SO) + optional `createPayment` (first payment).
- record → `createPayment` on an existing invoice.

This is the honest customer analog of the vendor single-row bill: a customer "bill" **is** an invoice; a payment against it is `invoice_payments`. Nothing duplicated.

## Out of scope

- No `customer_bills` table (that was Option B — rejected).
- No `updateInvoice` (edit invoice date/notes/total). Payments are append-only; "record payment" covers the vendor "edit amount/status" use.
- No printable (invoice printable already exists at `/customers/invoices/print/[id]`).

## Field mapping (vendor `BillForm` → customer `CustomerBillForm`)

| vendor                                                        | customer                                                                      |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `Supplier` select                                             | **`Customer`** select (`getCustomers`)                                        |
| `Linked PO` select + PO items card                            | **`Linked SO`** select (customer's SOs) + SO items card                       |
| `Bill Date` / `Due Date`                                      | **`Invoice Date`** / **`Due Date`**                                           |
| `Notes`                                                       | `Notes`                                                                       |
| `Payment Method` (cash/check)                                 | **`Payment Method`** (cash/check)                                             |
| `Check Number`                                                | `Check Number`                                                                |
| `Amount` → `paid_amount`, hidden `bill_status`/`total_amount` | **`Amount`** → `createPayment.amount`, hidden `invoice_status`/`total_amount` |
| buttons: `Add Bill` / `Edit` / `View`                         | `Add Bill` (new) / `View + Record Payment`                                    |

## Data reuse (no new money rows beyond the two existing writes)

- `createInvoice(CreateInvoiceData)` → invoice + `invoice_items` + SO status. Items are **re-derived server-side** from the SO (`getSalesOrderForInvoice`), never trusted from the client.
- `createPayment(CreatePaymentData)` → `invoice_payments` + paid/status.
- `getInvoice(id)` → invoice + items + payments (drives the View/Record sheet).
- `getCustomerBills()` → the list (already there).

## Deliverables

### 1. Query — `getSOsByCustomer(customerId)` in `queries/sales-orders.ts`

Customer's sales orders, grouped with their items (mirror `getPOBySupplierId` in `po.ts`).
Returns `CustomerSO[]`: `{ id, date_ordered, order_status, total_cost, so_items: { id, name, quantity, unit_price, total_price }[] }`.
Item `name = COALESCE(packages.name, products.sales_description)` so package + product lines both label. Decimal → `Number`.

### 2. Server — extend `/customers/bills/+page.server.ts`

- `load`: `depends('customers:bills')`; `bills = getCustomerBills()`, `customers = getCustomers()`, `bill = getInvoice(id)` if `?id`. Returns `{ bills, customers, bill }`.
- `actions`:
  - `getCustomerRelatedSO` → `getSOsByCustomer(parseInt(customer_id))` (mirror `getSupplierRelatedPO`).
  - `createBill` → zod: `sales_order_id`, `invoice_date`, `due_date`, `notes?`, `paid_amount?`, `payment_type?`, `check_number?`. Re-derive items from the SO; `createInvoice`; if `paid_amount > 0` → `createPayment`. Returns the created invoice (success).
  - `recordPayment` → zod: `invoice_id`, `payment_date?`, `amount`, `payment_type`, `check_number?`. `createPayment`. Success.

### 3. Component — `src/lib/components/pages/customers/bills/CustomerBillForm.svelte`

Mirror `BillForm.svelte` (same shadcn Sheet/Cards/Select/DatePicker, `enhance`/`applyAction`/`toast`/`invalidate('customers:bills')`).

- **New mode** (`bill == null`): Customer → Linked SO (hidden form `?/getCustomerRelatedSO`) → SO items card (read-only) + total → Invoice Date / Due Date / Notes → optional first Payment (method, check #, amount) → submit `?/createBill`.
- **View/Record mode** (`bill != null`): read-only customer / SO / items / total / paid / payments list → Payment card (method, check #, amount, date) → submit `?/recordPayment`.
- `hasTrigger` renders the header "Add Bill" (Plus) button; `open`/`bind:open` controlled by the page.

### 4. Page — `/customers/bills/+page.svelte`

- Import `CustomerBillForm`; `let openBillForm = $state(false)`; `customers = $derived(data?.customers)`; `bill = $derived(data?.bill)`.
- Header: `<CustomerBillForm bind:open={openBillForm} {bill} {form} {customers} />` (renders the Add button).
- `onViewBill(id)` → `openBillForm = true; goto('/customers/bills?id=…')`.
- Row actions → single "View" dropdown item → `onViewBill(bill.id)` (sheet is View + Record).

### 5. Tests — `test/customer-bills-form.spec.ts`

- `getSOsByCustomer` groups SOs + items, maps decimal → number, label via package/product.
- `createBill`/`recordPayment` action validation (missing required → 400; happy path returns success; payment only when amount > 0).
- page load returns `{ bills, customers, bill }` (bill resolved from `?id`).

## Gates (must be green before reporting)

- prettier · eslint clean on all touched files.
- svelte-check: no new errors.
- vitest: full suite green (new + regression).
- code review: pass (no Critical/Major).

## Verification (manual, user)

1. `/customers/bills` → **Add Bill** → pick Customer → SO → confirm SO items + total populate → Invoice/Due/Notes → (optional) Amount + Method → **Add Bill** → new invoice appears in the list with correct status.
2. Row **View** → confirm customer / SO / items / paid shown → **Record Payment** (amount, cash/check) → confirm balance reduces + status flips to partial/paid.
