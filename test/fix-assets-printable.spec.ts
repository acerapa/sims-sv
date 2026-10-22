import { describe, expect, it } from 'vitest';
import {
	buildFixAssetPdf,
	expandFixAssetItems,
	type FixAssetItemSource
} from '../src/routes/vendors/transfers/fix-assets/print/[id]/pdf';
import type { jsPDF } from 'jspdf';

// jsPDF 4 removed doc.getText(); standard-font text lands in the raw PDF
// content stream as literal `(...) Tj` operators, so we parse those.
const textItems = (doc: jsPDF): string[] => {
	const raw = doc.output() as string;
	const items: string[] = [];
	const re = /\(((?:\\.|[^()\\])*)\)\s*Tj/g;
	for (const m of raw.matchAll(re)) items.push(m[1]);
	return items;
};

const item = (overrides: Partial<FixAssetItemSource> = {}): FixAssetItemSource => ({
	item_description: 'Wireless Keyboard',
	serial_numbers: [],
	quantity: 2,
	cost: 1500,
	total_cost: 3000,
	...overrides
});

const FIX_ASSET = {
	id: 41,
	date_transfered: new Date(2026, 1, 17), // local noon-safe: no TZ date-roll risk
	user: 'technician',
	notes: 'Fragile cargo',
	items: [item(), item({ item_description: 'USB Cable', quantity: 1, cost: 120, total_cost: 120 })]
};

describe('expandFixAssetItems', () => {
	it('passes non-serial items through unchanged', () => {
		const [row] = expandFixAssetItems([item()]);
		// the row carries exactly the print fields; serial_numbers is a source-only input
		expect({
			item_description: row.item_description,
			serial_number: row.serial_number,
			quantity: row.quantity,
			cost: row.cost,
			total_cost: row.total_cost
		}).toEqual({
			item_description: 'Wireless Keyboard',
			serial_number: undefined,
			quantity: 2,
			cost: 1500,
			total_cost: 3000
		});
	});

	it('fans a multi-serial item out to one row per serial at quantity 1', () => {
		const rows = expandFixAssetItems([
			item({
				quantity: 3,
				serial_numbers: ['SN-001', 'SN-002', 'SN-003'],
				cost: 500,
				total_cost: 1500
			})
		]);
		expect(rows.map((r) => r.serial_number)).toEqual(['SN-001', 'SN-002', 'SN-003']);
		expect(rows.every((r) => r.quantity === 1)).toBe(true);
		// single-serial lines total at the unit cost
		expect(rows.map((r) => r.total_cost)).toEqual([500, 500, 500]);
	});

	it('keeps items and their serials in order across a mixed list', () => {
		const rows = expandFixAssetItems([
			item({ item_description: 'A', serial_numbers: ['S1', 'S2'] }),
			item({ item_description: 'B' })
		]);
		expect(rows.map((r) => `${r.item_description}:${r.serial_number ?? '-'}`)).toEqual([
			'A:S1',
			'A:S2',
			'B:-'
		]);
	});

	it('returns [] for an empty list', () => {
		expect(expandFixAssetItems([])).toEqual([]);
	});
});

describe('buildFixAssetPdf', () => {
	it('carries the report identity fields from the fix asset', () => {
		const flat = textItems(buildFixAssetPdf(FIX_ASSET));
		expect(flat).toContain('Fixed Asset Transfer');
		expect(flat).toContain('FIX-41');
		expect(flat).toContain('TRANSFER DATE');
		expect(flat).toContain('February 17, 2026');
		expect(flat).toContain('USER');
		expect(flat).toContain('Technician'); // enum value capitalized for display
		expect(flat).toContain('Items Transferred');
	});

	it('still renders the notes when they are null', () => {
		expect(textItems(buildFixAssetPdf({ ...FIX_ASSET, notes: null }))).toContain('---');
	});

	it('matches the preview truthy check: empty-string notes also render ---', () => {
		expect(textItems(buildFixAssetPdf({ ...FIX_ASSET, notes: '' }))).toContain('---');
	});

	it('renders every item row with right-hand money as Php, not the peso glyph', () => {
		const flat = textItems(buildFixAssetPdf(FIX_ASSET));
		for (const name of ['Wireless Keyboard', 'USB Cable']) expect(flat).toContain(name);
		expect(flat).toContain('Php 1,500.00'); // keyboard unit cost
		expect(flat).toContain('Php 3,000.00'); // keyboard line total
		expect(flat).toContain('Php 120.00'); // cable cost and total
		expect(flat.some((t) => t.includes('₱'))).toBe(false);
	});

	it('shows -- when a row has no serial, and the serial verbatim when it does', () => {
		// getFixAssetById always sets serial_number when an item carries exactly one serial
		const flat = textItems(
			buildFixAssetPdf({
				...FIX_ASSET,
				items: [item({ serial_numbers: ['SN-77'], serial_number: 'SN-77' })]
			})
		);
		expect(flat).toContain('SN-77');
		const plainDoc = textItems(buildFixAssetPdf({ ...FIX_ASSET, items: [item()] }));
		expect(plainDoc).toContain('--');
	});

	it('renders the empty state and never an item row', () => {
		const flat = textItems(buildFixAssetPdf({ ...FIX_ASSET, items: [] }));
		expect(flat).toContain('No items found for this Fix Asset.');
		expect(flat).not.toContain('Wireless Keyboard');
		expect(flat).toContain('Product');
		expect(flat).toContain('Total Cost');
	});

	it('footers every page with generated-on and page numbers', () => {
		const many = Array.from({ length: 120 }, (_, i) =>
			item({ item_description: `Inventory line ${i + 1}` })
		);
		const doc = buildFixAssetPdf({ ...FIX_ASSET, items: many });
		const pages = doc.getNumberOfPages();
		expect(pages).toBeGreaterThan(1);
		const flat = textItems(doc);
		expect(flat.filter((t) => t.startsWith('Generated on')).length).toBeGreaterThanOrEqual(pages);
		expect(flat).toContain(`Page 1 of ${pages}`);
		expect(flat).toContain(`Page ${pages} of ${pages}`);
	});

	it('keeps the note text when notes fit on the page', () => {
		expect(textItems(buildFixAssetPdf(FIX_ASSET))).toContain('Fragile cargo');
	});

	it('page-breaks very long notes instead of running them into the footer band', () => {
		const longAsset = {
			...FIX_ASSET,
			notes: Array.from({ length: 120 }, (_, i) => `Packing instruction ${i + 1}`).join('\n')
		};
		const doc = buildFixAssetPdf(longAsset);
		const pages = doc.getNumberOfPages();
		expect(pages).toBeGreaterThan(1); // the first page alone cannot hold 120 note lines + table
		const flat = textItems(doc);
		expect(flat).toContain('Packing instruction 1');
		expect(flat).toContain('Packing instruction 120');
		expect(flat).toContain('Items Transferred');
		expect(flat.filter((t) => t.startsWith('Generated on')).length).toBeGreaterThanOrEqual(pages);
	});
});
