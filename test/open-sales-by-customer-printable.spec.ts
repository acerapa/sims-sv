import { describe, expect, it } from 'vitest';
import {
	buildOpenSalesPdf,
	type OpenSalesData
} from '../src/routes/reports/open-sales-by-customer/print/pdf';

// jsPDF 4 removed getText()/getTextContent() — pull rendered strings out of the raw
// content stream (same approach as test/categories-printable.spec.ts).
function textIn(doc: { output: () => string }): string {
	const content = doc.output('arraybuffer') as ArrayBuffer;
	const text = new TextDecoder('latin1').decode(new Uint8Array(content));
	const parts: string[] = [];
	const re = /\(((?:\\.|[^()\\])*)\)\s*Tj/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(text))) parts.push(m[1]);
	return parts.join('\n');
}

const date1 = new Date('2026-07-10T00:00:00');
const date2 = new Date('2026-08-01T00:00:00');

// realistic shape of getOpenSalesGroupedByCustomer (string numerics included)
const data: OpenSalesData = {
	summary: [
		{
			customer: 'Acme Corp',
			total: 6000,
			sales: [
				{ sales_order_id: 101, date_ordered: date1, notes: null, total_cost: '3500.50' },
				{ sales_order_id: 102, date_ordered: date2, notes: 'rush order', total_cost: 2499.5 }
			]
		},
		{
			customer: 'Beta Ltd',
			total: 800,
			sales: [{ sales_order_id: 201, date_ordered: date1, notes: 'pending', total_cost: '800' }]
		}
	],
	detailed: [
		{
			customer: 'Acme Corp',
			total: 6000,
			sales: [
				{
					sales_order_id: '101',
					date_ordered: date1,
					total: '3500.50',
					items: [
						{ item_name: 'Keyboard', item_quantity: 2, item_cost: '1600', item_total_price: '3200' },
						{ item_name: null, item_quantity: null, item_cost: '150.25', item_total_price: '300.5' }
					]
				}
			]
		},
		{
			customer: 'Beta Ltd',
			total: 800,
			sales: [
				{
					sales_order_id: '201',
					date_ordered: date1,
					total: '800',
					items: [{ item_name: 'Cable', item_quantity: 4, item_cost: '200', item_total_price: '800' }]
				}
			]
		}
	]
};

const empty: OpenSalesData = { summary: [], detailed: [] };
const filters = { from: '2026-07-01', to: '2026-08-31' };

describe('buildOpenSalesPdf — summary view', () => {
	it('renders title, both customers, SO rows with notes fallback, per-customer totals', () => {
		const text = textIn(buildOpenSalesPdf(data, 'summary', filters));
		expect(text).toContain('Open Sales by Customer — Summary');
		expect(text).toContain('Customer');
		expect(text).toContain('Acme Corp');
		expect(text).toContain('Beta Ltd');
		expect(text).toContain('101');
		expect(text).toContain('-'); // notes: null → '-'
		expect(text).toContain('rush order');
		expect(text).toContain('Acme Corp Total:');
		expect(text).toContain('Beta Ltd Total:');
	});

	it('Grand Total reduces the summary sales total_cost (string numerics)', () => {
		const lines = textIn(buildOpenSalesPdf(data, 'summary', filters)).split('\n');
		expect(lines).toContain('Grand Total:');
		expect(lines).toContain('Php 6,800.00'); // 3500.50 + 2499.50 + 800 — the preview's formula
	});

	it('empty range renders "No data available."', () => {
		const text = textIn(buildOpenSalesPdf(empty, 'summary', filters));
		expect(text).toContain('No data available.');
		expect(text).not.toContain('Acme Corp');
	});
});

describe('buildOpenSalesPdf — detailed view', () => {
	it('renders customer → SO header (with date) → items → SO Total → customer Total', () => {
		const doc = buildOpenSalesPdf(data, 'detailed', filters);
		const text = textIn(doc);
		expect(text).toContain('Open Sales by Customer — Detail');
		expect(text).toContain('Sales Order #101');
		expect(text).toContain('Keyboard');
		expect(text).toContain('Cable');
		expect(text).toContain('SO #101 Total:');
		expect(text).toContain('SO #201 Total:');
		expect(text).toContain('Php 3,500.50');
	});

	it('renders null item_name / item_quantity as blanks, not "null"', () => {
		const doc = buildOpenSalesPdf(data, 'detailed', filters);
		const lines = textIn(doc).split('\n');
		expect(lines.every((l) => l !== 'null')).toBe(true);
	});

	it('empty detailed view renders an empty table (head + Grand Total foot, no data rows)', () => {
		const text = textIn(buildOpenSalesPdf(empty, 'detailed', filters));
		expect(text).toContain('Item');
		expect(text).toContain('Grand Total:');
		expect(text).toContain('Php 0.00');
	});
});

describe('buildOpenSalesPdf — both view', () => {
	it('summary + forced page break + "Detail" heading + detailed sections', () => {
		const doc = buildOpenSalesPdf(data, 'both', filters);
		const lines = textIn(doc).split('\n');
		expect(lines).toContain('Grand Total:');
		const detailIdx = lines.indexOf('Detail');
		expect(detailIdx).toBeGreaterThanOrEqual(0);
		const soIdx = lines.findIndex((l) => l.includes('Sales Order #101'));
		expect(soIdx).toBeGreaterThan(detailIdx);
		expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(2);
	});
});

describe('date range + view title', () => {
	it('renders the date range subtitle from filters', () => {
		expect(textIn(buildOpenSalesPdf(data, 'summary', filters))).toContain('July 1, 2026');
	});

	it('renders "All Dates" when no filters', () => {
		expect(textIn(buildOpenSalesPdf(data, 'summary'))).toContain('All Dates');
	});

	it('canonical view value is "detailed" (list page TabsTrigger)', () => {
		expect(textIn(buildOpenSalesPdf(data, 'detailed'))).toContain('— Detail');
	});
});
