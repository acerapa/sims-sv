import { describe, expect, it } from 'vitest';
import {
	buildPurchasesByItemPdf,
	groupDetailByCategory,
	type PbiDetailRow
} from '../src/routes/reports/purchases-by-item/pdf';

// jsPDF 4 removed getText()/getTextContent() in favor of doc.canvas, so pull rendered
// strings straight out of the content stream (same approach as purchases-by-vendor spec).
function textIn(doc: { output: () => string }): string {
	const content = doc.output('arraybuffer') as ArrayBuffer;
	const text = new TextDecoder('latin1').decode(new Uint8Array(content));
	const parts: string[] = [];
	const re = /\(((?:\\.|[^()\\])*)\)\s*Tj/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(text))) parts.push(m[1]);
	return parts.join('\n');
}

function row(overrides: Partial<PbiDetailRow> = {}): PbiDetailRow {
	return {
		category_id: 1,
		category_name: 'Keyboards',
		transaction_type: 'Purchase Order',
		po_reference: 'PO-2026-001',
		receive_date: '2026-07-10T00:00:00',
		memo: '',
		supplier_name: 'Acme Supplies',
		product_sku: 'KB-001',
		product_name: 'Wireless Keyboard',
		quantity: 2,
		cost: '2500',
		total_cost: '5000',
		...overrides
	};
}

const detail = [
	row(),
	row({
		po_reference: 'PO-2026-002',
		product_sku: 'MS-001',
		product_name: 'Mouse',
		quantity: 1,
		cost: '1899',
		total_cost: '1899'
	}),
	row({
		category_id: 2,
		category_name: 'Cables',
		memo: 'urgent restock',
		supplier_name: 'Beta Hardware',
		product_sku: 'CP-001',
		product_name: 'Cable',
		quantity: 4,
		cost: '200',
		total_cost: '800'
	})
];

const summary = [
	{ category_id: 1, category_name: 'Keyboards', po_count: 2, total_items: 3, total_amount: '6899' },
	{ category_id: 2, category_name: 'Cables', po_count: 1, total_items: 4, total_amount: '800' }
];

const filters = { from: '2026-07-01', to: '2026-07-31' };

const data = { summary, detail };

describe('groupDetailByCategory', () => {
	it('groups rows into categories and keeps order of first appearance', () => {
		const grouped = groupDetailByCategory(detail);
		expect(grouped.map((s) => s.category_name)).toEqual(['Keyboards', 'Cables']);
		expect(grouped[0].lines.map((l) => l.product_sku)).toEqual(['KB-001', 'MS-001']);
	});

	it('assigns a running balance across the whole report, not per category', () => {
		const grouped = groupDetailByCategory(detail);
		expect(grouped[0].lines.map((l) => l.running_balance)).toEqual([5000, 6899]);
		expect(grouped[1].lines.map((l) => l.running_balance)).toEqual([7699]);
	});

	it('computes each category subtotal from its line totals (string numerics included)', () => {
		const grouped = groupDetailByCategory(detail);
		expect(grouped[0].subtotal).toBe(6899);
		expect(grouped[1].subtotal).toBe(800);
	});

	it('returns no sections for an empty row list and treats blank amounts as zero', () => {
		expect(groupDetailByCategory([])).toEqual([]);
		const grouped = groupDetailByCategory([row({ total_cost: '' })]);
		expect(grouped).toHaveLength(1);
		expect(grouped[0].lines[0].running_balance).toBe(0);
		expect(grouped[0].subtotal).toBe(0);
	});
});

describe('buildPurchasesByItemPdf', () => {
	it('detail view: per-category sections, all line columns, and running balances', async () => {
		const text = textIn(await buildPurchasesByItemPdf(data, 'detail', filters));
		expect(text).toContain('Purchases by Item — Detail');
		expect(text).toContain('Keyboards');
		expect(text).toContain('Cables');
		for (const col of ['Type', 'Date', 'Ref No.', 'Memo', 'Vendor', 'Item', 'Qty', 'Cost Price', 'Amount', 'Balance']) {
			expect(text).toContain(col);
		}
		expect(text).toContain('Wireless Keyboard');
		expect(text).toContain('Cable');
		expect(text).toContain('urgent restock');
		expect(text).toContain('Php 5,000.00');
		expect(text).toContain('Php 6,899.00');
		expect(text).toContain('Php 7,699.00');
		expect(text).toContain('Subtotal: Php 6,899.00');
		expect(text).toContain('Subtotal: Php 800.00');
	});

	it('detail view is landscape so the ten columns fit', async () => {
		const doc = await buildPurchasesByItemPdf(data, 'detail', filters);
		expect(doc.internal.pageSize.getWidth()).toBeGreaterThan(doc.internal.pageSize.getHeight());
	});

	it('detail view with empty range renders the empty-state text and no subtotals', async () => {
		const text = textIn(await buildPurchasesByItemPdf({ summary: [], detail: [] }, 'detail'));
		expect(text).toContain('No purchases found for the selected date range.');
		expect(text).not.toContain('Subtotal:');
	});

	it('summary view: title, category rows, Grand Total reduces, portrait orientation', async () => {
		const doc = await buildPurchasesByItemPdf(data, 'summary', filters);
		const text = textIn(doc);
		expect(text).toContain('Purchases by Item — Summary');
		expect(text).toContain('Keyboards');
		expect(text).toContain('Cables');
		expect(text).toContain('Php 6,899.00');
		expect(text).toContain('Grand Total');
		const lines = text.split('\n');
		expect(lines).toContain('3'); // 2 + 1 POs — exact cell
		expect(lines).toContain('7'); // 3 + 4 items
		expect(lines).toContain('Php 7,699.00');
		expect(doc.internal.pageSize.getWidth()).toBeLessThan(doc.internal.pageSize.getHeight());
	});

	it('summary view: empty range renders the empty-state row and no Grand Total', async () => {
		const text = textIn(await buildPurchasesByItemPdf({ summary: [], detail: [] }, 'summary'));
		expect(text).toContain('No purchases found for the selected date range.');
		expect(text).not.toContain('Grand Total');
	});

	it('both view: summary table then a Detail heading before the sections', async () => {
		const lines = textIn(await buildPurchasesByItemPdf(data, 'both', filters)).split('\n');
		expect(lines).toContain('Grand Total');
		expect(lines).toContain('Purchases by Item');
		const detailIdx = lines.indexOf('Detail');
		expect(detailIdx).toBeGreaterThanOrEqual(0);
		expect(lines.indexOf('PO-2026-001')).toBeGreaterThan(detailIdx);
	});

	it('both view with empty detail: empty-state text under the Detail heading', async () => {
		const text = textIn(await buildPurchasesByItemPdf({ summary, detail: [] }, 'both'));
		expect(text).toContain('Detail');
		expect(text).toContain('No purchases found for the selected date range.');
	});
});
