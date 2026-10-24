import { describe, expect, it } from 'vitest';
import { buildPackageDetailsPdf, type PackageDetailsData } from '../src/routes/vendors/packages/print/[id]/pdf';

// jsPDF 4 text extraction is not exposed on the Node API surface, so read the
// rendered text ops back out of the raw content stream (same as the other
// printable specs in this directory).
function textIn(doc: { output: () => string }): string {
	const content = doc.output('arraybuffer') as ArrayBuffer;
	const text = new TextDecoder('latin1').decode(new Uint8Array(content));
	const parts: string[] = [];
	const re = /\(((?:\\.|[^()\\])*)\)\s*Tj/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(text))) parts.push(m[1]);
	return parts.join('\n');
}

function makePkg(overrides: Partial<PackageDetailsData> = {}): PackageDetailsData {
	return {
		id: 7,
		name: 'Starter Kit',
		description: 'A bundle of office basics',
		total_price: '555.00',
		created_at: new Date('2026-07-10T12:00:00'),
		items: [
			{
				product_id: 1,
				quantity: 2,
				serial_number: 'SN-1',
				price: '100.00',
				total_price: '200.00',
				product: { id: 1, sku: 'WH-001', sales_description: 'Widget' }
			},
			{
				product_id: 2,
				quantity: 1,
				serial_number: null,
				price: '33.00',
				total_price: '33.00',
				product: { id: 2, sku: 'WH-002', sales_description: null }
			}
		],
		...overrides
	};
}

describe('buildPackageDetailsPdf — structure', () => {
	it('returns a one-page letter document for a typical package', async () => {
		const doc = await buildPackageDetailsPdf(makePkg());
		expect(doc.getNumberOfPages()).toBe(1);
		expect(doc.internal.pageSize.getWidth()).toBe(612); // letter portrait
	});

	it('renders the branded header and the package title', async () => {
		const text = textIn(await buildPackageDetailsPdf(makePkg()));
		expect(text).toContain('RAM TECH VENTURES INC.');
		expect(text).toContain('Package — Starter Kit');
	});

	it('renders the report footer (Generated on + Page 1 of 1)', async () => {
		const text = textIn(await buildPackageDetailsPdf(makePkg()));
		expect(text).toContain('Generated on');
		expect(text).toContain('Page 1 of 1');
	});
});

describe('buildPackageDetailsPdf — info block', () => {
	it('renders description, created date, and item count', async () => {
		const text = textIn(await buildPackageDetailsPdf(makePkg()));
		expect(text).toContain('Description: A bundle of office basics');
		// en-US fixed locale from formatDatePdf
		expect(text).toContain('Created: July 10, 2026');
		expect(text).toContain('Items: 2');
	});

	it('omits the description line only when the package has none', async () => {
		const text = textIn(await buildPackageDetailsPdf(makePkg({ description: null })));
		expect(text).toContain('Created: July 10, 2026');
		expect(text).toContain('Items: 2');
	});

	it('wraps a very long description without dropping the item count line', async () => {
		const text = textIn(await buildPackageDetailsPdf(makePkg({ description: 'very long '.repeat(40) })));
		expect(text).toContain('Items: 2');
	});
});

describe('buildPackageDetailsPdf — items table', () => {
	it('renders the seven-column header', async () => {
		const text = textIn(await buildPackageDetailsPdf(makePkg()));
		for (const col of ['#', 'Description', 'SKU', 'Qty', 'Rate', 'S/N', 'Amount']) {
			expect(text).toContain(col);
		}
	});

	it('renders every line with SKU, serial, and Php-formatted money', async () => {
		const text = textIn(await buildPackageDetailsPdf(makePkg()));
		expect(text).toContain('WH-001');
		expect(text).toContain('Widget');
		expect(text).toContain('SN-1');
		expect(text).toContain('Php 100.00');
		expect(text).toContain('Php 200.00');
		expect(text).not.toContain('₱');
	});

	it('shows the empty state instead of an empty table when there are no items', async () => {
		const doc = await buildPackageDetailsPdf(makePkg({ items: [] }));
		const text = textIn(doc);
		expect(text).toContain('No items in this package.');
		expect(doc.getNumberOfPages()).toBeGreaterThan(0);
	});

	it('renders all lines for a 30-item package, with clean pagination', async () => {
		const pkg = makePkg({
			items: Array.from({ length: 30 }, (_, i) => ({
				product_id: i + 1,
				quantity: 1,
				serial_number: null,
				price: '1.00',
				total_price: '1.00',
				product: { id: i + 1, sku: `WH-${i + 1}`, sales_description: `Item ${i + 1}` }
			}))
		});
		const doc = await buildPackageDetailsPdf(pkg);
		const text = textIn(doc);
		for (let i = 1; i <= 30; i++) expect(text).toContain(`Item ${i}`);
		expect(text).toContain('Items: 30');
	});
});

describe('buildPackageDetailsPdf — total', () => {
	it('prints the stored package total, not the recomputed item sum', async () => {
		const text = textIn(await buildPackageDetailsPdf(makePkg()));
		expect(text).toContain('Total: Php 555.00');
		// 200 + 33 = 233 — this must NOT appear as the total
		expect(text).not.toContain('Total: Php 233.00');
	});

	it('falls back to Php 0.00 when the stored total is null', async () => {
		const text = textIn(await buildPackageDetailsPdf(makePkg({ total_price: null })));
		expect(text).toContain('Total: Php 0.00');
	});
});
