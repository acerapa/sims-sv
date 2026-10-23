import { describe, expect, it } from 'vitest';
import {
	buildPurchasesByVendorPdf,
	groupDetailByVendor,
	type PbvDetailRow
} from '../src/routes/reports/purchases-by-vendor/print/pdf';

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

function row(overrides: Partial<PbvDetailRow> = {}): PbvDetailRow {
	return {
		supplier_id: 1,
		supplier_name: 'Acme Supplies',
		po_id: 11,
		po_reference: 'PO-2026-001',
		receive_date: '2026-07-10T00:00:00',
		po_total: '5000',
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
		po_id: 12,
		po_reference: 'PO-2026-002',
		po_total: '1899',
		product_sku: 'MS-001',
		product_name: 'Mouse',
		quantity: 1,
		cost: '1899',
		total_cost: '1899'
	}),
	row({
		supplier_id: 2,
		supplier_name: 'Beta Hardware',
		po_id: 21,
		po_reference: 'PO-2026-010',
		po_total: '800',
		product_sku: 'CP-001',
		product_name: 'Cable',
		quantity: 4,
		cost: '200',
		total_cost: '800'
	})
];

const summary = [
	{ supplier_id: 1, supplier_name: 'Acme Supplies', po_count: 2, total_items: 3, total_amount: '6899' },
	{ supplier_id: 2, supplier_name: 'Beta Hardware', po_count: 1, total_items: 4, total_amount: '800' }
];

const filters = { from: '2026-07-01', to: '2026-07-31' };

describe('groupDetailByVendor', () => {
	it('groups rows into vendor → PO → item, dedupes, and keeps order of first appearance', async () => {
		const grouped = groupDetailByVendor(detail);
		expect(grouped.map((v) => v.supplier_name)).toEqual(['Acme Supplies', 'Beta Hardware']);
		expect(grouped[0].pos.map((po) => po.po_id)).toEqual([11, 12]);
	});

	it('computes each vendor subtotal from PO totals (string numerics included)', async () => {
		const grouped = groupDetailByVendor(detail);
		expect(grouped[0].subtotal).toBe(6899);
		expect(grouped[1].subtotal).toBe(800);
	});

	it('sums multiple item rows into one PO and treats blank PO totals as zero', async () => {
		const grouped = groupDetailByVendor([
			row({ po_id: 7, po_reference: 'PO-A', po_total: '0' }),
			row({ po_id: 7, po_reference: 'PO-A', po_total: '0', product_sku: 'KB-002', product_name: '2nd row' }),
			row({ po_id: 8, po_reference: 'PO-B', po_total: '120.50' })
		]);
		expect(grouped).toHaveLength(1);
		expect(grouped[0].pos).toHaveLength(2);
		expect(grouped[0].pos[0].items).toHaveLength(2);
		expect(grouped[0].subtotal).toBe(120.5);
	});
});

describe('buildPurchasesByVendorPdf', () => {
	it('summary view: title, both vendor rows, and the Grand Total reduces', async () => {
		const text = textIn(await buildPurchasesByVendorPdf({ summary, detail }, 'summary', filters));
		expect(text).toContain('Purchases by Vendor — Summary');
		expect(text).toContain('Vendor Name');
		expect(text).toContain('Acme Supplies');
		expect(text).toContain('Beta Hardware');
		expect(text).toContain('Php 6,899.00');
		expect(text).toContain('Grand Total');
		const lines = text.split('\n');
		expect(lines).toContain('3'); // 2 + 1 POs — exact cell
		expect(lines).toContain('7'); // 3 + 4 items
		expect(lines).toContain('Php 7,699.00');
	});

	it('summary view: empty range renders the empty-state row and no Grand Total', async () => {
		const text = textIn(await buildPurchasesByVendorPdf({ summary: [], detail: [] }, 'summary'));
		expect(text).toContain('No purchase orders found for the selected date range.');
		expect(text).not.toContain('Grand Total');
	});

	it('detail view: vendors in order, PO headers, items, per-vendor subtotals', async () => {
		const text = textIn(await buildPurchasesByVendorPdf({ summary, detail }, 'detail', filters));
		expect(text).toContain('Purchases by Vendor — Detail');
		const acmeIdx = text.indexOf('PO-2026-001');
		const betaIdx = text.indexOf('PO-2026-010');
		expect(acmeIdx).toBeGreaterThanOrEqual(0);
		expect(betaIdx).toBeGreaterThan(acmeIdx);
		expect(text).toContain('Wireless Keyboard');
		expect(text).toContain('Cable');
		expect(text).toContain('Unit Cost');
		expect(text).toContain('Subtotal: Php 6,899.00');
		expect(text).toContain('Subtotal: Php 800.00');
	});

	it('detail view: page break before every vendor except the first', async () => {
		const doc = await buildPurchasesByVendorPdf({ summary, detail }, 'detail', filters);
		expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(2);
	});

	it('both view: summary + Detail heading + sections', async () => {
		const lines = textIn(await buildPurchasesByVendorPdf({ summary, detail }, 'both', filters)).split('\n');
		expect(lines).toContain('Grand Total');
		const detailIdx = lines.indexOf('Detail');
		expect(detailIdx).toBeGreaterThanOrEqual(0);
		expect(lines.indexOf('PO-2026-001')).toBeGreaterThan(detailIdx);
	});

	it('both view with empty detail: empty-state text under the Detail heading', async () => {
		const text = textIn(await buildPurchasesByVendorPdf({ summary: [], detail: [] }, 'both'));
		expect(text).toContain('Detail');
		expect(text).toContain('No purchase orders found for the selected date range.');
	});
});
