import { describe, expect, it } from 'vitest';
import { buildRmaPdf } from '../src/routes/vendors/transfers/rmas/print/[id]/pdf';

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

const sample = {
	id: 83,
	supplier_name: 'Acme Components',
	date_returned: new Date(2026, 6, 15),
	notes: null,
	items: [
		{ purchase_description: 'Wireless Keyboard', serial_number: 'SN-1001', quantity: 1, cost: 1899, total_cost: 1899 },
		{ purchase_description: 'Logitech M185', serial_number: '', quantity: 2, cost: 899, total_cost: 1798 }
	]
};

describe('buildRmaPdf', () => {
	it('renders the corrected title (not the IBRR copy-paste)', () => {
		const text = textIn(buildRmaPdf(sample));
		expect(text).toContain('Return Merchandise Authorization');
		expect(text).not.toContain('Inter-Branch Receiving Report');
	});

	it('renders the RMA reference, transfer date and supplier', () => {
		const text = textIn(buildRmaPdf(sample));
		expect(text).toContain('RMA-83');
		expect(text).toContain('July 15, 2026');
		expect(text).toContain('Acme Components');
	});

	it('renders blank serials as -- and entered serials verbatim', () => {
		const lines = textIn(buildRmaPdf(sample)).split('\n');
		expect(lines).toContain('SN-1001');
		// exact cell match — a line-equality check so it can't be satisfied by the notes "---"
		expect(lines).toContain('--');
	});

	it('renders notes exactly as entered, and the --- placeholder when empty or a blank string', () => {
		const entered = textIn(buildRmaPdf({ ...sample, notes: 'Defective on arrival. One unit.' }));
		expect(entered).toContain('Defective on arrival. One unit.');

		const empty = textIn(buildRmaPdf({ ...sample, notes: null }));
		expect(empty).toContain('---');

		// falsy (not just null) → '---', matching the preview's truthy check
		const blank = textIn(buildRmaPdf({ ...sample, notes: '' }));
		expect(blank).toContain('---');
	});

	it('renders the approved empty-state wording (and not the old STR copy-paste)', () => {
		const text = textIn(buildRmaPdf({ ...sample, items: [] }));
		expect(text).toContain('No items found for this RMA.');
		expect(text).not.toContain('No items found for the selected Stock Transfer Request.');
	});

	it('renders the missing-supplier row as an empty value, not "null"', () => {
		const text = textIn(
			buildRmaPdf({ ...sample, supplier_name: null, items: [{ purchase_description: null, serial_number: null, quantity: 1, cost: 100, total_cost: 100 }] })
		);
		expect(text).not.toMatch(/null/);
	});

	it('renders Php money for numeric and string values alike (Postgres numeric arrives as a string)', () => {
		const text = textIn(
			buildRmaPdf({ ...sample, items: [{ purchase_description: 'X', serial_number: null, quantity: '1', cost: '1234.5', total_cost: '1234.5' }] })
		);
		expect(text).toContain('Php 1,234.50');
	});

	it('uses the standard letter portrait size (shared scaffold) and a per-page footer', () => {
		const doc = buildRmaPdf(sample);
		expect(doc.internal.pageSize.getWidth()).toBeCloseTo(612); // letter pt, per createReportDoc
		expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
		const text = textIn(doc);
		expect(text).toContain('Page 1 of');
		expect(text).toContain('Generated on');
	});
});
