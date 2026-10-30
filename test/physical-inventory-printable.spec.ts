import { describe, expect, it } from 'vitest';
import {
	buildPhysicalInventoryPdf,
	type PhysicalInventoryPrintData
} from '../src/routes/vendors/physical-inventory/print/[id]/pdf';
import { formatDatePdf } from '../src/lib/utils/pdf';

// jsPDF 4 removed getText()/getTextContent() in favor of doc.canvas, so pull rendered
// strings straight out of the content stream (same approach as bills-printable.spec.ts).
function textIn(doc: { output: () => string }): string {
	const content = doc.output('arraybuffer') as ArrayBuffer;
	const text = new TextDecoder('latin1').decode(new Uint8Array(content));
	const parts: string[] = [];
	const re = /\(((?:\\.|[^()\\])*)\)\s*Tj/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(text))) parts.push(m[1]);
	return parts.join('\n');
}

const sample: PhysicalInventoryPrintData = {
	id: 17,
	title: 'Lahat Branch — Q3 Close',
	status: 'finalized',
	date_finalized: new Date(2025, 10, 31),
	created_by: 'jane.doe@ramtech.ph',
	notes: 'Cycle count after branch transfer.',
	items: [
		{
			sku: 'KB-WLS',
			purchase_description: 'Wireless Keyboard',
			category: 'Peripherals',
			system_count: 100,
			actual_count: 95,
			difference: -5
		},
		{
			sku: 'USB-HUB7',
			purchase_description: '7-Port USB Hub',
			category: 'Peripherals',
			system_count: 40,
			actual_count: 47,
			difference: 7
		},
		{
			sku: 'MON-24',
			purchase_description: '24" Monitor',
			category: 'Displays',
			system_count: 20,
			actual_count: 20,
			difference: 0
		}
	]
};

describe('buildPhysicalInventoryPdf', () => {
	it('renders the sheet title, PC number with status, preparer and finalize date', async () => {
		const text = textIn(await buildPhysicalInventoryPdf(sample));
		expect(text).toContain('Physical Inventory Sheet');
		expect(text).toContain('PC-0017');
		expect(text).toContain('Finalized');
		expect(text).toContain('Lahat Branch — Q3 Close');
		expect(text).toContain('jane.doe@ramtech.ph');
		expect(text).toContain(formatDatePdf(new Date(2025, 10, 31)));
	});

	it('renders every item line with SKU, category and counts', async () => {
		const text = textIn(await buildPhysicalInventoryPdf(sample));
		expect(text).toContain('Wireless Keyboard');
		expect(text).toContain('KB-WLS');
		expect(text).toContain('Peripherals');
		expect(text).toContain('7-Port USB Hub');
		expect(text).toContain('24" Monitor');
		expect(text).toContain('100');
		expect(text).toContain('95');
	});

	it('prints differences with explicit signs and the totals row sums the columns', async () => {
		const text = textIn(await buildPhysicalInventoryPdf(sample));
		expect(text).toContain('+7');
		expect(text).toContain('-5');
		// sums: 100+40+20=160, 95+47+20=162, -5+7+0=+2
		expect(text).toContain('160');
		expect(text).toContain('162');
		expect(text).toContain('+2');
		// jsPDF escapes parentheses in the raw stream
		expect(text).toContain('Total \\(3 items\\)');
	});

	it('shows the empty-items placeholder when a finalized sheet has no lines', async () => {
		const text = textIn(await buildPhysicalInventoryPdf({ ...sample, items: [] }));
		expect(text).toContain('No items on this inventory sheet.');
		expect(text).not.toContain('Total \\(');
	});

	it('draft sheet prints a fill-in sheet: Counted and Difference blank, totals limited to system counts', async () => {
		const draft = textIn(
			await buildPhysicalInventoryPdf({ ...sample, status: 'draft', date_finalized: null })
		);
		expect(draft).toContain('Draft');
		// draft follows the page table: Difference column is dropped entirely
		expect(draft).not.toContain('Difference');
		// signed differences and the counted/actual totals must be blank
		expect(draft).not.toContain('+7');
		expect(draft).not.toContain('-5');
		expect(draft).not.toContain('162');
		expect(draft).not.toContain('+2');
		// system column still prints, with its total
		expect(draft).toContain('100');
		expect(draft).toContain('160');
		expect(draft).toContain('Total \\(');
		// un-finalized date renders as the em-dash placeholder
		expect(draft).toContain('—');
	});

	it('keeps entered notes verbatim and omits the Notes block when blank', async () => {
		const entered = textIn(await buildPhysicalInventoryPdf({ ...sample, notes: 'Counted twice.' }));
		expect(entered).toContain('Counted twice.');

		const blank = textIn(await buildPhysicalInventoryPdf({ ...sample, notes: '' }));
		expect(blank).toContain('---');
	});
});
