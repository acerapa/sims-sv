import { describe, expect, it } from 'vitest';
import { buildSalesByRepPdf, type SalesByRepData } from '../src/routes/reports/sales-by-rep/print/pdf';

// jsPDF 4 removed getText()/getTextContent() in favor of doc.canvas, so pull rendered
// strings straight out of the content stream (same approach as test/categories-printable.spec.ts).
function textIn(doc: { output: () => string }): string {
	const content = doc.output('arraybuffer') as ArrayBuffer;
	const text = new TextDecoder('latin1').decode(new Uint8Array(content));
	const parts: string[] = [];
	const re = /\(((?:\\.|[^()\\])*)\)\s*Tj/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(text))) parts.push(m[1]);
	return parts.join('\n');
}

const longDate = (d: string) => new Date(d).toLocaleDateString('default', { day: 'numeric', month: 'long', year: 'numeric' });

const data: SalesByRepData = {
	detailed: [
		{
			rep_name: 'Ana Reyes',
			subtotal: 10000,
			invoices: [
				{
					invoice_id: '101',
					invoice_date: new Date(2026, 6, 10),
					invoice_notes: 'rush order',
					subtotal: 8000,
					balance: 0,
					items: [
						{ item_name: 'Laptop Bundle', item_quantity: 1, item_price: 8000, item_total: 8000 },
						{ item_name: 'Mouse', item_quantity: 4, item_price: 500, item_total: 2000 }
					]
				},
				{
					invoice_id: '102',
					invoice_date: new Date(2026, 6, 12),
					invoice_notes: null,
					subtotal: 2000,
					balance: 0,
					items: [{ item_name: 'Keyboard', item_quantity: 2, item_price: 1000, item_total: 2000 }]
				}
			]
		},
		{
			rep_name: 'Ben Cruz',
			subtotal: 3500.25,
			invoices: [
				{
					invoice_id: '77',
					invoice_date: new Date(2026, 6, 20),
					invoice_notes: 'net 30',
					subtotal: 3500.25,
					balance: 0,
					items: [{ item_name: 'Monitor', item_quantity: 1, item_price: 3500.25, item_total: 3500.25 }]
				}
			]
		}
	]
};

const filters = { from: '2026-07-01', to: '2026-07-31' };

describe('buildSalesByRepPdf', () => {
	it('renders title, date range, rep sections, invoice headers, and money cells', async () => {
		const text = textIn(await buildSalesByRepPdf(data, filters));

		expect(text).toContain('Sales by Representative');
		expect(text).toContain(longDate('2026-07-01'));
		expect(text).toContain(`— ${longDate('2026-07-31')}`);
		expect(text).toContain('Ana Reyes');
		expect(text).toContain('Ben Cruz');
		expect(text).toContain('INV-101');
		expect(text).toContain('INV-102');
		expect(text).toContain('rush order');
		expect(text).toContain('net 30');
		expect(text).toContain('Php 10,000.00');
		expect(text).toContain('Php 3,500.25'); // string money from Postgres renders
		const lines = text.split('\n');
		expect(lines).toContain('4'); // exact qty cell, not a substring of money
		expect(lines).toContain('Balance');
		expect(lines).toContain('Subtotal: Php 10,000.00');
		expect(lines).toContain('Subtotal: Php 3,500.25');
		expect(lines).toContain('TOTAL: Php 13,500.25');
	});

	it('keeps reps and invoices in data order', async () => {
		const text = textIn(await buildSalesByRepPdf(data, filters));

		const anaIdx = text.indexOf('Ana Reyes');
		const benIdx = text.indexOf('Ben Cruz');
		expect(anaIdx).toBeGreaterThanOrEqual(0);
		expect(benIdx).toBeGreaterThan(anaIdx);
		expect(text.indexOf('INV-101')).toBeLessThan(text.indexOf('INV-102'));
	});

	it('puts a page break before every rep except the first', async () => {
		const doc = await buildSalesByRepPdf(data, filters);

		expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(2);
	});

	it('renders the empty state for an empty range and no subtotals', async () => {
		const text = textIn(await buildSalesByRepPdf({ detailed: [] }));

		expect(text).toContain('No invoices found for the selected date range.');
		expect(text).toContain('All Dates');
		expect(text).not.toContain('Subtotal');
	});

	it('renders null item quantities as an empty cell, not "null"', async () => {
		const text = textIn(
			await buildSalesByRepPdf({
				detailed: [
					{
						rep_name: 'Nulla Corp',
						subtotal: 100,
						invoices: [
							{
								invoice_id: '1',
								invoice_date: new Date(2026, 6, 1),
								invoice_notes: null,
								subtotal: 100,
								balance: 0,
								items: [{ item_name: 'Widget', item_quantity: null, item_price: 100, item_total: 100 }]
							}
						]
					}
				]
			})
		);

		expect(text).not.toMatch(/null/);
	});
});
