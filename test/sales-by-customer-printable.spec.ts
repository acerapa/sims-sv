import { describe, expect, it } from 'vitest';
import { buildSalesByCustomerPdf } from '../src/routes/reports/sales-by-customer/print/pdf';

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

// same options as PrintReportLayout/formatDate, so the expected label is locale-consistent
const longDate = (d: string) => new Date(d).toLocaleDateString('default', { day: 'numeric', month: 'long', year: 'numeric' });

const data = {
	summary: [
		{ customer_name: 'Alfa Trading', total_orders: 2, total_items: 5, total_sales: 10000 },
		{ customer_name: 'Beta Supply', total_orders: 1, total_items: 2, total_sales: '3500.25' }
	],
	detailed: [
		{
			customer_name: 'Alfa Trading',
			subtotal: 10000,
			orders: [
				{
					sales_order_id: '101',
					date_ordered: new Date(2026, 6, 10),
					order_status: 'invoiced',
					items: [
						{ product_name: 'Laptop Bundle', item_quantity: 1, item_price: 8000, item_total: 8000 },
						{ product_name: 'Mouse', item_quantity: 4, item_price: 500, item_total: 2000 }
					]
				}
			]
		},
		{
			customer_name: 'Beta Supply',
			subtotal: 3500.25,
			orders: [
				{
					sales_order_id: '102',
					date_ordered: new Date(2026, 6, 12),
					order_status: 'Pending Payment',
					items: [{ product_name: 'Keyboard', item_quantity: 2, item_price: 1750.125, item_total: 3500.25 }]
				}
			]
		}
	]
};

const filters = { from: '2026-07-01', to: '2026-07-31' };

describe('buildSalesByCustomerPdf', () => {
	it('summary view: title, range subtitle, both rows, and the Grand Total reduce', async () => {
		const text = textIn(await buildSalesByCustomerPdf(data, 'summary', filters));
		expect(text).toContain('Sales by Customer — Summary');
		expect(text).toContain(`— ${longDate('2026-07-31')}`);
		expect(text).toContain(longDate('2026-07-01'));
		expect(text).toContain('Alfa Trading');
		expect(text).toContain('Beta Supply');
		expect(text).toContain('Php 10,000.00');
		expect(text).toContain('Php 3,500.25'); // string money from Postgres
		expect(text).toContain('Grand Total');
		const lines = text.split('\n');
		expect(lines).toContain('3'); // 2 + 1 orders — exact cell, not a substring of the money column
		expect(lines).toContain('Php 13,500.25');
	});

	it('summary view: empty range renders the exact empty-state row and no Grand Total', async () => {
		const text = textIn(await buildSalesByCustomerPdf({ summary: [], detailed: [] }, 'summary'));
		expect(text).toContain('No sales orders found for the selected date range.');
		expect(text).not.toContain('Grand Total');
		expect(text).toContain('All Dates');
	});

	it('detail view: customer sections in order, SO header with title-cased status, subtotals', async () => {
		const text = textIn(await buildSalesByCustomerPdf(data, 'detail', filters));
		expect(text).toContain('Sales by Customer — Detail');
		const alfaIdx = text.indexOf('SO-101');
		const betaIdx = text.indexOf('SO-102');
		expect(alfaIdx).toBeGreaterThanOrEqual(0);
		expect(betaIdx).toBeGreaterThan(alfaIdx);
		expect(text).toContain('Invoiced');
		expect(text).toContain('Pending Payment');
		expect(text).toContain('Subtotal: Php 10,000.00');
		expect(text).toContain('Subtotal: Php 3,500.25');
	});

	it('detail view: page breaks before every customer except the first', async () => {
		const doc = await buildSalesByCustomerPdf(data, 'detail', filters);
		const pages = doc.getNumberOfPages();
		expect(pages).toBeGreaterThanOrEqual(2);
	});

	it('renders null item quantities as an empty cell, not "null"', async () => {
		const text = textIn(
			await buildSalesByCustomerPdf(
				{
					summary: [],
					detailed: [
						{
							customer_name: 'Nulla Corp',
							subtotal: 100,
							orders: [
								{
									sales_order_id: '1',
									date_ordered: new Date(2026, 6, 1),
									order_status: 'shipped',
									items: [{ product_name: 'Widget', item_quantity: null, item_price: 100, item_total: 100 }]
								}
							]
						}
					]
				},
				'detail'
			)
		);
		expect(text).not.toMatch(/null/);
	});

	it('both view: summary, Detail heading, then sections', async () => {
		const both = await buildSalesByCustomerPdf(data, 'both', filters);
		const lines = textIn(both).split('\n');
		expect(lines).toContain('Grand Total');
		const detailIdx = lines.indexOf('Detail'); // exact heading cell (not the '— Detail' title)
		expect(detailIdx).toBeGreaterThanOrEqual(0);
		expect(lines.indexOf('SO-101')).toBeGreaterThan(detailIdx);
	});

	it('both view with empty detail: empty-state text under the Detail heading', async () => {
		const text = textIn(await buildSalesByCustomerPdf({ summary: [], detailed: [] }, 'both'));
		expect(text).toContain('Detail');
		expect(text).toContain('No sales orders found for the selected date range.');
	});
});
