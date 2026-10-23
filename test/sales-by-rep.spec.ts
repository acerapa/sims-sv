import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/server/db', () => ({
	db: { select: vi.fn() }
}));

import { db } from '../src/lib/server/db';
import { getSalesByRep } from '../src/lib/server/db/queries/reports/sales-by-rep';

type Builder = { where: { mockResolvedValue: (rows: unknown[]) => unknown } };

/**
 * db.select(...) returns one builder; from/innerJoin/leftJoin chain back to
 * it and where() resolves the awaited row set.
 */
const stubRows = (rows: Record<string, unknown>[]) => {
	const builder: Builder = { where: vi.fn().mockResolvedValue(rows) as never };
	builder.from = vi.fn(() => builder) as never;
	builder.innerJoin = vi.fn(() => builder) as never;
	builder.leftJoin = vi.fn(() => builder) as never;
	(db.select as unknown as ReturnType<typeof vi.fn>).mockReturnValue(builder);
};

const itemRow = (overrides: Record<string, unknown> = {}) => ({
	rep_name: 'Ana Reyes',
	invoice_id: 101,
	invoice_date: new Date('2026-07-01'),
	invoice_notes: null,
	item_name: 'Laptop Bundle',
	item_quantity: 1,
	item_price: '8000',
	item_total: '8000',
	...overrides
});

describe('getSalesByRep', () => {
	it('returns an empty list when there are no rows in range', async () => {
		stubRows([]);

		const result = await getSalesByRep();

		expect(result).toEqual([]);
	});

	it('groups rows by representative, invoice, and line item', async () => {
		stubRows([
			itemRow({ invoice_id: 102, item_name: 'Mouse', item_quantity: '2', item_price: '500', item_total: '2000' }),
			itemRow({ invoice_id: 101, invoice_notes: 'rush order' }),
			itemRow({
				rep_name: 'Ben Cruz',
				invoice_id: 77,
				invoice_notes: 'net 30',
				item_name: 'Keyboard',
				item_quantity: '2',
				item_price: '1750.5',
				item_total: '3501'
			})
		]);

		const result = await getSalesByRep();

		expect(result.map((rep) => rep.rep_name)).toEqual(['Ana Reyes', 'Ben Cruz']);

		const [ana, ben] = result;
		expect(ana.invoices.map((invoice) => invoice.invoice_id)).toEqual([101, 102]);
		expect(ana.invoices[0]).toMatchObject({ invoice_notes: 'rush order', subtotal: 8000 });
		expect(ana.invoices[1].subtotal).toBe(2000);
		expect(ana.subtotal).toBe(10000);
		expect(ben.invoices).toHaveLength(1);
		expect(ben.invoices[0].items[0]).toMatchObject({
			item_name: 'Keyboard',
			item_quantity: '2',
			item_total: '3501'
		});
	});

	it('keeps multiple line items of one invoice under that invoice', async () => {
		stubRows([
			itemRow({ item_name: 'Laptop' }),
			itemRow({ item_name: 'Mouse', item_quantity: '4', item_price: '500', item_total: '2000' })
		]);

		const [rep] = await getSalesByRep();

		expect(rep.invoices).toHaveLength(1);
		expect(rep.invoices[0].items.map((item) => item.item_name)).toEqual(['Laptop', 'Mouse']);
		expect(rep.invoices[0].subtotal).toBe(10000);
	});

	it('uses a placeholder balance of 0 until the definition is finalized', async () => {
		stubRows([itemRow()]);

		const [rep] = await getSalesByRep();

		expect(rep.invoices[0].balance).toBe(0);
	});

	it('treats missing item totals as zero when totaling', async () => {
		stubRows([
			itemRow({ item_name: 'With total', item_total: '8000' }),
			itemRow({ item_name: 'No total', item_total: null })
		]);

		const [rep] = await getSalesByRep();

		expect(rep.invoices[0].subtotal).toBe(8000);
	});
});
