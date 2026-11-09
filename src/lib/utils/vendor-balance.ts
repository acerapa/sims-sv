/**
 * Vendor Balance Detail — pure ledger derivation, shared by the report page,
 * the print preview, and the PDF. Money math runs in integer cents so
 * numeric(14,2) values never drift on float addition.
 */

/** Raw bill facts as returned by getVendorBalanceDetail(). */
export type VbdBillRow = {
	supplier_id: number | null;
	supplier_name: string;
	bill_id: number;
	bill_date: Date | string;
	po_reference: string | null;
	notes: string | null;
	total_amount: string;
	paid_amount: string;
	/** Sum of (total − paid) over the vendor's bills before the report range. */
	opening_balance: string;
};

/** One ledger line under a vendor heading. */
export interface VbdLedgerRow {
	type: 'Bill';
	bill_id: number;
	date: Date | string;
	num: string;
	memo: string;
	/** Billed amount for this bill (always positive). */
	amount: number;
	/** Running balance owed to the vendor after this bill. */
	balance: number;
}

/** A vendor group: its bills, running balances, and totals. */
export interface VbdVendorLedger {
	supplier_id: number | null;
	supplier_name: string;
	opening_balance: number;
	rows: VbdLedgerRow[];
	/** Sum of billed amounts in range. */
	total_amount: number;
	/** Sum of paid amounts in range. */
	total_paid: number;
	/** Opening balance plus the net effect of all in-range bills. */
	ending_balance: number;
}

const toCents = (value: string | number): number => Math.round(Number(value ?? 0) * 100);
const fromCents = (cents: number): number => cents / 100;

/**
 * Groups bill rows by vendor and computes the running balance.
 *
 * Expects the query ordering (supplier name, bill_date, bill_id). Each bill's
 * effect on the amount owed is `total_amount − paid_amount`; the balance after
 * a bill is the cumulative effect starting from that vendor's opening balance.
 */
export const buildVendorLedgers = (rows: VbdBillRow[]): VbdVendorLedger[] => {
	const ledgers: VbdVendorLedger[] = [];
	let current: VbdVendorLedger | null = null;
	let runningCents = 0;
	let totalCents = 0;
	let paidCents = 0;

	for (const row of rows) {
		let vendor: VbdVendorLedger;
		if (
			current !== null &&
			current.supplier_id === row.supplier_id &&
			current.supplier_name === row.supplier_name
		) {
			vendor = current;
		} else {
			if (current) {
				current.total_amount = fromCents(totalCents);
				current.total_paid = fromCents(paidCents);
				current.ending_balance = fromCents(runningCents);
			}
			runningCents = toCents(row.opening_balance);
			totalCents = 0;
			paidCents = 0;
			vendor = {
				supplier_id: row.supplier_id,
				supplier_name: row.supplier_name,
				opening_balance: fromCents(runningCents),
				rows: [],
				total_amount: 0,
				total_paid: 0,
				ending_balance: 0
			};
			current = vendor;
			ledgers.push(vendor);
		}

		const amountCents = toCents(row.total_amount);
		const paidNowCents = toCents(row.paid_amount);
		totalCents += amountCents;
		paidCents += paidNowCents;
		runningCents += amountCents - paidNowCents;

		vendor.rows.push({
			type: 'Bill',
			bill_id: row.bill_id,
			date: row.bill_date,
			num: row.po_reference ?? `Bill #${row.bill_id}`,
			memo: row.notes ?? '',
			amount: fromCents(amountCents),
			balance: fromCents(runningCents)
		});
	}

	if (current) {
		current.total_amount = fromCents(totalCents);
		current.total_paid = fromCents(paidCents);
		current.ending_balance = fromCents(runningCents);
	}

	return ledgers;
};

/** Grand total across vendors: sum of ending balances (amount owed). */
export const grandTotalBalance = (ledgers: VbdVendorLedger[]): number =>
	fromCents(ledgers.reduce((acc, l) => acc + Math.round(l.ending_balance * 100), 0));
