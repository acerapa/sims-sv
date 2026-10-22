import { describe, expect, it } from 'vitest';
import { buildIbrrPdf } from '../src/routes/vendors/transfers/ibrrs/print/[id]/pdf';

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
	id: 57,
	str_id: 42,
	source_store_name: 'Lahat Branch',
	notes: null,
	items: [
		{ purchase_description: 'Wireless Keyboard', quantity: 2, cost: 1899, total_cost: 3798 },
		{ purchase_description: 'Logitech M185', quantity: 1, cost: 899, total_cost: 899 }
	]
};

describe('buildIbrrPdf', () => {
	it('renders the report title and the four preview fields (IBRR- prefix, not STR-)', () => {
		const text = textIn(buildIbrrPdf(sample));
		expect(text).toContain('Inter-Branch Receiving Report');
		expect(text).toContain('IBRR-57');
		expect(text).toContain('STR-42');
		expect(text).toContain('Lahat Branch');
		expect(text).not.toContain('STR-IBRR-');
	});

	it('renders notes exactly as entered, and the --- placeholder when empty or a blank string', () => {
		const entered = textIn(buildIbrrPdf({ ...sample, notes: 'Handle with care. Two boxes.' }));
		expect(entered).toContain('Handle with care. Two boxes.');

		const empty = textIn(buildIbrrPdf({ ...sample, notes: null }));
		expect(empty).toContain('---');

		// falsy (not just null) → '---', matching the preview's truthy check
		const blank = textIn(buildIbrrPdf({ ...sample, notes: '' }));
		expect(blank).toContain('---');
	});

	it('renders the Items section with every item on one line each', () => {
		const text = textIn(buildIbrrPdf(sample));
		const lines = text.split('\n');
		expect(lines).toContain('Wireless Keyboard');
		expect(lines).toContain('Logitech M185');
		expect(lines).toContain('2');
		expect(lines).toContain('Php 1,899.00');
		expect(lines).toContain('Php 3,798.00');
		expect(lines).toContain('1');
		expect(lines).toContain('Php 899.00');
	});

	it('keeps every item row on a single logical line (no mid-row wrapping)', () => {
		const lines = textIn(buildIbrrPdf(sample)).split('\n');
		// description, qty and total of each row must all sit in the stream — a wrapped
		// description would still appear as separate Tj segments, so additionally assert no
		// orphaned fragment of a description appears without its row sibling being full
		for (const line of lines) {
			if (line.startsWith('Wireless Ke')) expect(line).toBe('Wireless Keyboard');
			if (line.startsWith('Logitech M1')) expect(line).toBe('Logitech M185');
		}
	});

	it('renders the approved empty-state wording (and not the old STR copy-paste)', () => {
		const text = textIn(buildIbrrPdf({ ...sample, items: [] }));
		expect(text).toContain('No items found for this Inter-Branch Receiving Report.');
		expect(text).not.toContain('No items found for the selected Stock Transfer Request.');
	});

	it('renders the missing-source-store row as an empty value, not "null"', () => {
		const text = textIn(buildIbrrPdf({ ...sample, source_store_name: null }));
		expect(text).not.toMatch(/null/);
	});

	it('renders Php money for numeric and string values alike (Postgres numeric arrives as a string)', () => {
		const text = textIn(
			buildIbrrPdf({ ...sample, items: [{ purchase_description: 'X', quantity: '1', cost: '1234.5', total_cost: '1234.5' }] })
		);
		expect(text).toContain('Php 1,234.50');
	});

	it('uses the standard letter portrait size (shared scaffold) and a per-page footer', () => {
		const doc = buildIbrrPdf(sample);
		expect(doc.internal.pageSize.getWidth()).toBeCloseTo(612); // letter pt, per createReportDoc
		expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
		const text = textIn(doc);
		expect(text).toContain('Page 1 of');
		expect(text).toContain('Generated on');
	});
});
