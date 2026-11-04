import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/server/db', () => ({
	db: { select: vi.fn() }
}));

vi.mock('../src/lib/server/db/queries/customers', () => ({
	getCustomers: vi.fn().mockResolvedValue([{ id: 1, name: 'Jomar Corp' }])
}));

import { db } from '../src/lib/server/db';
import { getCustomerBills } from '../src/lib/server/db/queries/invoices';

type Builder = { where: { mockResolvedValue: (rows: unknown[]) => unknown } };

/** select().from().innerJoin().where().orderBy() — only the terminal call resolves. */
const stubRows = (rows: Record<string, unknown>[]) => {
	const builder: Builder = {
		where: vi.fn().mockImplementation(() => ({
			orderBy: vi.fn().mockResolvedValue(rows) as never
		})) as never
	};
	builder.from = vi.fn(() => builder) as never;
	builder.innerJoin = vi.fn(() => builder) as never;
	builder.leftJoin = vi.fn(() => builder) as never;
	(db.select as unknown as ReturnType<typeof vi.fn>).mockReturnValue(builder);
};

const billRow = (overrides: Record<string, unknown> = {}) => ({
	id: 11,
	customer_name: 'Jomar Corp',
	sales_order_id: 42,
	invoice_date: new Date('2026-11-01'),
	due_date: new Date('2026-11-15'),
	invoice_status: 'partially_paid',
	total_amount: '10000',
	paid_amount: '4000',
	...overrides
});

describe('getCustomerBills', () => {
	it('maps a bill row and computes the outstanding balance', async () => {
		stubRows([billRow()]);

		const [bill] = await getCustomerBills();
		expect(bill).toEqual({
			id: 11,
			customer_name: 'Jomar Corp',
			sales_order_id: 42,
			invoice_date: new Date('2026-11-01'),
			due_date: new Date('2026-11-15'),
			invoice_status: 'partially_paid',
			total_amount: '10000',
			paid_amount: '4000',
			balance: 6000
		});
	});

	it('clamps the balance to zero when an invoice is overpaid', async () => {
		stubRows([billRow({ paid_amount: '12000' })]);

		const [bill] = await getCustomerBills();
		expect(bill.balance).toBe(0);
	});

	it('returns an empty list when there are no bills', async () => {
		stubRows([]);
		expect(await getCustomerBills()).toEqual([]);
	});

	describe('page load', () => {
		it('passes the bills through to the page', async () => {
			stubRows([billRow()]);
			const { load } = await import('../src/routes/customers/bills/+page.server');
			const data = await load({
				url: { searchParams: new URLSearchParams() },
				depends: vi.fn()
			} as never);
			expect(data.bills).toHaveLength(1);
			expect(data.bills[0].balance).toBe(6000);
			expect(data.customers).toHaveLength(1);
			expect(data.bill).toBeNull();
		});
	});
});
