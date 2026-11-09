import { describe, expect, it } from 'vitest';
import {
	buildVendorBalancePdf,
	type VendorBalancePdfData
} from '../src/routes/reports/vendor-balance-detail/print/pdf';
import { buildVendorLedgers, type VbdBillRow } from '../src/lib/utils/vendor-balance';

// jsPDF 4 removed getText()/getTextContent() in favor of doc.canvas, so pull rendered
// strings straight out of the content stream (same approach as the other printables).
function textIn(doc: { output: () => string }): string {
	const content = doc.output('arraybuffer') as ArrayBuffer;
	const text = new TextDecoder('latin1').decode(new Uint8Array(content));
	const parts: string[] = [];
	const re = /\(((?:\\.|[^()\\])*)\)\s*Tj/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(text))) parts.push(m[1]);
	return parts.join('\n');
}

const usDate = (d: string) =>
	new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

const billRow = (overrides: Partial<VbdBillRow> = {}): VbdBillRow => ({
	supplier_id: 1,
	supplier_name: 'Acme Supplies',
	bill_id: 101,
	bill_date: new Date('2026-07-01'),
	po_reference: 'PO-1',
	notes: null,
	total_amount: '0',
	paid_amount: '0',
	opening_balance: '0',
	...overrides
});

const data: VendorBalancePdfData = {
	ledgers: buildVendorLedgers([
		billRow({
			bill_id: 1,
			total_amount: '1000',
			paid_amount: '400',
			notes: 'rush order',
			opening_balance: '750'
		}),
		billRow({
			bill_id: 2,
			bill_date: new Date('2026-07-15'),
			po_reference: 'PO-2',
			total_amount: '250'
		}),
		billRow({
			supplier_id: 2,
			supplier_name: 'Beta Trading',
			bill_id: 3,
			bill_date: new Date('2026-07-20'),
			po_reference: 'PO-7',
			total_amount: '3500.25',
			paid_amount: '3500.25'
		})
	])
};

const filters = { from: '2026-07-01', to: '2026-07-31' };

describe('buildVendorBalancePdf', () => {
	it('renders title, range, vendor sections, ledger rows, and running balances', async () => {
		const text = textIn(await buildVendorBalancePdf(data, filters));

		expect(text).toContain('Vendor Balance Detail');
		expect(text).toContain(usDate('2026-07-01'));
		expect(text).toContain(`— ${usDate('2026-07-31')}`);

		// vendor sections
		expect(text).toContain('Acme Supplies');
		expect(text).toContain('Beta Trading');
		expect(text.indexOf('Acme Supplies')).toBeLessThan(text.indexOf('Beta Trading'));

		// opening balance + ledger rows
		expect(text).toContain('Opening Balance');
		expect(text).toContain('Php 750.00');
		expect(text).toContain('PO-1');
		expect(text).toContain('rush order');
		expect(text).toContain('PO-2');
		expect(text).toContain('Php 1,350.00'); // 750 + (1000 − 400)
		expect(text).toContain('Php 1,600.00'); // + 250

		// vendor totals + grand total
		expect(text).toContain('Total Acme Supplies');
		expect(text).toContain('Php 1,250.00'); // Acme total billed
		expect(text).toContain('Total Beta Trading');
		expect(text).toContain('Php 3,500.25');
		expect(text).toContain('TOTAL ALL VENDORS: Php 1,600.00');
	});

	it('renders the bill type and the per-row date', async () => {
		const text = textIn(await buildVendorBalancePdf(data, filters));

		expect(text).toContain('Bill');
		expect(text).toContain(usDate('2026-07-15'));
		expect(text).toContain(usDate('2026-07-20'));
	});

	it('renders the empty state for an empty range and no totals', async () => {
		const text = textIn(await buildVendorBalancePdf({ ledgers: [] }));

		expect(text).toContain('No bills found for the selected range.');
		expect(text).toContain('All Dates');
		expect(text).not.toContain('TOTAL ALL VENDORS');
	});
});
