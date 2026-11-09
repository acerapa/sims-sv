import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/server/db', () => ({
	db: { execute: vi.fn() }
}));

import { db } from '../src/lib/server/db';
import { getVendorBalanceDetail } from '../src/lib/server/db/queries/reports/vendor-balance-detail';
import {
	buildVendorLedgers,
	grandTotalBalance,
	type VbdBillRow
} from '../src/lib/utils/vendor-balance';

const billRow = (overrides: Partial<VbdBillRow> = {}): VbdBillRow => ({
	supplier_id: 1,
	supplier_name: 'Acme Supplies',
	bill_id: 101,
	bill_date: new Date('2026-07-01'),
	po_reference: 'PO-1',
	notes: null,
	total_amount: '1000',
	paid_amount: '0',
	opening_balance: '0',
	...overrides
});

describe('buildVendorLedgers', () => {
	it('returns an empty list for an empty range', () => {
		expect(buildVendorLedgers([])).toEqual([]);
	});

	it('starts an unpaid bill at its full amount with a zero opening', () => {
		const [vendor] = buildVendorLedgers([billRow({ total_amount: '1000' })]);

		expect(vendor.opening_balance).toBe(0);
		expect(vendor.rows).toHaveLength(1);
		expect(vendor.rows[0]).toMatchObject({
			type: 'Bill',
			num: 'PO-1',
			amount: 1000,
			balance: 1000
		});
		expect(vendor.ending_balance).toBe(1000);
	});

	it('reduces the balance by the bill paid amount', () => {
		const [vendor] = buildVendorLedgers([billRow({ total_amount: '1000', paid_amount: '400' })]);

		expect(vendor.rows[0].balance).toBe(600);
		expect(vendor.total_amount).toBe(1000);
		expect(vendor.total_paid).toBe(400);
		expect(vendor.ending_balance).toBe(600);
	});

	it('accumulates bills chronologically within a vendor', () => {
		const [vendor] = buildVendorLedgers([
			billRow({ bill_id: 1, total_amount: '500', paid_amount: '500' }),
			billRow({
				bill_id: 2,
				bill_date: new Date('2026-07-15'),
				total_amount: '300',
				paid_amount: '0'
			})
		]);

		expect(vendor.rows.map((r) => r.balance)).toEqual([0, 300]);
		expect(vendor.ending_balance).toBe(300);
	});

	it('adds the opening balance before the first in-range bill', () => {
		const [vendor] = buildVendorLedgers([
			billRow({ opening_balance: '750', total_amount: '250', paid_amount: '0' })
		]);

		expect(vendor.opening_balance).toBe(750);
		expect(vendor.rows[0].balance).toBe(1000);
		expect(vendor.ending_balance).toBe(1000);
	});

	it('computes each vendor independently', () => {
		const ledgers = buildVendorLedgers([
			billRow({ bill_id: 1, total_amount: '500', paid_amount: '100' }),
			billRow({
				supplier_id: 2,
				supplier_name: 'Beta Trading',
				bill_id: 2,
				total_amount: '200',
				paid_amount: '200',
				opening_balance: '40'
			})
		]);

		expect(ledgers).toHaveLength(2);
		expect(ledgers[0].ending_balance).toBe(400);
		expect(ledgers[1].rows[0].balance).toBe(40); // opening 40 + (200 − 200)
		expect(ledgers[1].ending_balance).toBe(40);
		expect(grandTotalBalance(ledgers)).toBe(440);
	});

	it('keeps two-decimal money exact across additions', () => {
		const [vendor] = buildVendorLedgers([
			billRow({ bill_id: 1, total_amount: '0.10' }),
			billRow({ bill_id: 2, bill_date: new Date('2026-07-02'), total_amount: '0.20' })
		]);

		expect(vendor.rows.map((r) => r.balance)).toEqual([0.1, 0.3]);
	});

	it('falls back to a bill number and an empty memo when PO reference/notes are missing', () => {
		const [vendor] = buildVendorLedgers([billRow({ po_reference: null, notes: null })]);

		expect(vendor.rows[0].num).toBe('Bill #101');
		expect(vendor.rows[0].memo).toBe('');
	});
});

describe('getVendorBalanceDetail', () => {
	it('returns the query rows as the ledger input', async () => {
		const rows = [billRow()];
		(db.execute as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(rows);

		await expect(getVendorBalanceDetail('2026-07-01', '2026-07-31')).resolves.toEqual(rows);
	});
});
