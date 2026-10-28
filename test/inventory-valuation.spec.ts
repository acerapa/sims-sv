import { describe, expect, it } from 'vitest';
import {
	buildInventoryValuationPdf,
	groupByProduct,
	type IvDetailRow,
	type IvSummaryRow
} from '../src/routes/reports/inventory-valuation/pdf';

function detailRow(overrides: Partial<IvDetailRow> = {}): IvDetailRow {
	return {
		product_id: 1,
		product_sku: 'ITEM-A',
		product_name: 'Product A',
		category_name: 'Electronics',
		transaction_type: 'Purchase',
		txn_date: '2026-02-10T00:00:00Z',
		ref_no: 'PO-001',
		counterparty: 'Supplier One',
		quantity: 100,
		unit_cost: '12.34',
		on_hand_after: 100,
		asset_value_after: '1234.00',
		current_stock: 100,
		is_opening: false,
		...overrides
	};
}

function summaryRow(overrides: Partial<IvSummaryRow> = {}): IvSummaryRow {
	return {
		product_id: 1,
		product_sku: 'ITEM-A',
		product_name: 'Product A',
		category_name: 'Electronics',
		opening: 40,
		qty_in: 100,
		qty_out: 25,
		movement_count: 2,
		ending: 115,
		ending_value: '1234.56',
		...overrides
	};
}

// jsPDF 4 removed getText()/getTextContent() — pull rendered strings out of the raw
// content stream (same approach as test/ibrr-printable.spec.ts).
function textIn(doc: { output: () => string }): string {
	const content = doc.output('arraybuffer') as ArrayBuffer;
	const text = new TextDecoder('latin1').decode(new Uint8Array(content));
	const parts: string[] = [];
	const re = /\(((?:\\.|[^()\\])*)\)\s*Tj/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(text))) parts.push(m[1]);
	return parts.join('\n');
}

const sampleDetail = [
	detailRow(),
	detailRow({
		transaction_type: 'Sale',
		txn_date: '2026-02-14T00:00:00Z',
		ref_no: 'SO-007',
		counterparty: 'Customer One',
		quantity: -25,
		on_hand_after: 75,
		current_stock: 75,
		asset_value_after: '925.50'
	}),
	detailRow({
		product_id: 2,
		product_sku: 'ITEM-B',
		product_name: 'Product B',
		transaction_type: 'Fixed Asset',
		quantity: -10,
		on_hand_after: 90,
		asset_value_after: '1110.00',
		unit_cost: '5.50',
		current_stock: 80 // deliberately differs from on_hand_after: mismatch case
	})
];

describe('groupByProduct', () => {
	it('groups rows into per-product sections preserving order', () => {
		const sections = groupByProduct(sampleDetail);

		expect(sections).toHaveLength(2);
		expect(sections[0].product_sku).toBe('ITEM-A');
		expect(sections[1].product_sku).toBe('ITEM-B');
		expect(sections[0].lines).toHaveLength(2);
		expect(sections[1].lines).toHaveLength(1);
	});

	it('flags a section when the reconstructed balance differs from system stock', () => {
		const sections = groupByProduct(sampleDetail);

		const a = sections.find((s) => s.product_sku === 'ITEM-A');
		const b = sections.find((s) => s.product_sku === 'ITEM-B');

		expect(a && a.stock_mismatch).toBe(false);
		expect(b && b.stock_mismatch).toBe(true);
		expect(b && b.system_stock).toBe(80);
	});
});

describe('buildInventoryValuationPdf (detail)', () => {
	it('renders per-product tables with running balances and literal currency', async () => {
		const doc = await buildInventoryValuationPdf({ summary: [], detail: sampleDetail }, 'detail');
		const text = textIn(doc);

		expect(text).toContain('Inventory Valuation Detail');
		expect(text).toContain('ITEM-A');
		expect(text).toContain('Product A');
		expect(text).toContain('ITEM-B');
		expect(text).toContain('On Hand');
		expect(text).toContain('Purchase');
		expect(text).toContain('Sale');
		expect(text).toContain('Fixed Asset');
		expect(text).toContain('+100');
		expect(text).toContain('-25');
		expect(text).toContain('Php 1,234.00');
		expect(text).toContain('Php 925.50');
	});

	it('marks stock-mismatch notes and explains excluded movements', async () => {
		const doc = await buildInventoryValuationPdf({ summary: [], detail: sampleDetail }, 'detail');
		const text = textIn(doc);

		expect(text).toContain('reconstructed ending balance');
		expect(text).toContain('RMAs and physical inventory counts');
	});

	it('renders an empty-state message when there are no movements', async () => {
		const doc = await buildInventoryValuationPdf({ summary: [], detail: [] }, 'detail');
		const text = textIn(doc);

		expect(text).toContain('No stock movements found for the selected date range.');
	});
});

describe('buildInventoryValuationPdf (summary)', () => {
	it('renders the summary table with grand totals and literal currency', async () => {
		const doc = await buildInventoryValuationPdf(
			{
				summary: [
					summaryRow(),
					summaryRow({
						product_id: 2,
						product_sku: 'ITEM-B',
						product_name: 'Product B',
						opening: 0,
						qty_in: 20,
						qty_out: 5,
						ending: 15,
						ending_value: '82.50'
					})
				],
				detail: []
			},
			'summary'
		);
		const text = textIn(doc);

		expect(text).toContain('Inventory Valuation Summary');
		expect(text).toContain('Grand Total');
		// 1234.56 + 82.50 = 1317.06
		expect(text).toContain('Php 1,317.06');
		expect(text).toContain('Php 82.50');
	});
});
