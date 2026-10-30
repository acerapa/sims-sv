import { describe, expect, it } from 'vitest';
import { formatDatePdf } from '$lib/utils/pdf';
import {
	buildDrPdf,
	WARRANTY_TEXT,
	type DeliveryReceiptOrder
} from '../src/routes/customers/sales-orders/[id]/print/pdf';

// jsPDF 4 text extraction is not exposed on the Node API surface, so read the
// rendered text ops back out of the raw content stream (same idiom as the sibling receipt spec).
function textIn(doc: Awaited<ReturnType<typeof buildDrPdf>>): string {
	const raw = Buffer.from(doc.output('arraybuffer')).toString('latin1');
	const parts: string[] = [];
	for (const m of raw.matchAll(/\(((?:\\.|[^()\\])*)\)\s*Tj/g)) parts.push(m[1]);
	return parts.join('\n');
}

// Whitespace-normalized: splitTextToSize wraps the warranty paragraph across
// content-stream ops, so compare on single-spaced text.
function textFlat(doc: Awaited<ReturnType<typeof buildDrPdf>>): string {
	return textIn(doc).replace(/\s+/g, ' ');
}

function makeOrder(overrides: Partial<DeliveryReceiptOrder> = {}): DeliveryReceiptOrder {
	return {
		id: 7,
		date_ordered: new Date('2026-07-10T12:00:00'),
		total_cost: '1999602.30',
		customer: { name: 'ACME Corp', address: '123 Main St, Calbayog' },
		staff: { name: 'John Doe' },
		items: [
			{
				quantity: 2,
				unit_price: '100.00',
				total_price: '200.00',
				serial_number: 'SN-1',
				product: { sales_description: 'Widget' },
				package: undefined
			},
			{
				quantity: 1,
				unit_price: '33.00',
				total_price: '33.00',
				serial_number: null,
				product: undefined,
				package: { name: 'Kit' }
			},
			{
				quantity: 5,
				unit_price: '9.99',
				total_price: '49.95',
				serial_number: undefined,
				product: { sales_description: null },
				package: { name: null }
			}
		],
		...overrides
	};
}

describe('buildDrPdf — structure', () => {
	it('returns a jsPDF document on letter portrait', async () => {
		const doc = await buildDrPdf(makeOrder());
		expect(doc.getNumberOfPages()).toBeGreaterThan(0);
		expect(doc.internal.pageSize.getWidth()).toBe(612);
	});

	it('is one page for a typical 3-item delivery receipt', async () => {
		expect((await buildDrPdf(makeOrder())).getNumberOfPages()).toBe(1);
	});

	it('renders its own company header, not the report-brand header', async () => {
		const text = textIn(await buildDrPdf(makeOrder()));
		expect(text).toContain('RAM TECH VENTURES INC.');
		expect(text).toContain('BARTOLOME BLDG., MAGSAYSAY ST. BLVD.');
		expect(text).toContain('CALBAYOG CITY, SAMAR');
		expect(text).toContain('D.R');
		expect(text).not.toContain('Sales, Accounts Payables & Inventory');
	});

	it('renders the reference table: DATE, S.O. NO., P.O. NO., REP with values', async () => {
		const text = textIn(await buildDrPdf(makeOrder()));
		expect(text).toContain('DATE');
		expect(text).toContain('S.O. NO.');
		expect(text).toContain('P.O. NO.');
		expect(text).toContain('REP');
		const order = makeOrder();
		expect(text).toContain(formatDatePdf(order.date_ordered));
		expect(text).toContain(String(order.id));
		expect(text).toContain('John Doe');
	});
});

describe('buildDrPdf — Name/Address box', () => {
	it('renders the customer name and address', async () => {
		const text = textIn(await buildDrPdf(makeOrder()));
		expect(text).toContain('Name/Address');
		expect(text).toContain('ACME Corp');
		expect(text).toContain('123 Main St, Calbayog');
	});

	it('handles a missing customer with no crash', async () => {
		const doc = await buildDrPdf(makeOrder({ customer: null }));
		expect(textIn(doc)).toContain('Name/Address');
		expect(doc.getNumberOfPages()).toBeGreaterThan(0);
	});
});

describe('buildDrPdf — items table', () => {
	it('renders name falling back package -> sales_description, with the D.R. column set', async () => {
		const text = textIn(await buildDrPdf(makeOrder()));
		expect(text).toContain('Item Description');
		expect(text).toContain('Serial No.');
		expect(text).toContain('Qty');
		expect(text).toContain('UP');
		expect(text).toContain('Total');
		expect(text).toContain('Widget');
		expect(text).toContain('Kit');
	});

	it('renders quantity, serial, and Php-formatted money (no peseta glyph)', async () => {
		const text = textIn(await buildDrPdf(makeOrder()));
		expect(text).toContain('2');
		expect(text).toContain('SN-1');
		expect(text).toContain('Php 100.00');
		expect(text).toContain('Php 200.00');
		expect(text).not.toContain('₱');
	});

	it('renders all lines even for a 15-item receipt', async () => {
		const order = makeOrder({
			items: Array.from({ length: 15 }, (_, i) => ({
				quantity: 1,
				unit_price: '1.00',
				total_price: '1.00',
				serial_number: null,
				product: { sales_description: `Item ${i + 1}` },
				package: undefined
			}))
		});
		const text = textIn(await buildDrPdf(order));
		for (let i = 1; i <= 15; i++) expect(text).toContain(`Item ${i}`);
		expect(text).toContain('SUB-TOTAL');
		expect(text).toContain('TOTAL AMOUNT');
	});
});

describe('buildDrPdf — totals', () => {
	it('computes SUB-TOTAL from item total_price and prints order.total_cost as-is', async () => {
		const text = textIn(await buildDrPdf(makeOrder()));
		expect(text).toContain('SUB-TOTAL');
		expect(text).toContain('Php 282.95'); // 200 + 33 + 49.95
		expect(text).toContain('TOTAL AMOUNT');
		expect(text).toContain('Php 1,999,602.30');
	});

	it('handles an empty receipt: all sections render, no crash', async () => {
		const doc = await buildDrPdf(
			makeOrder({ items: [], total_cost: 0, customer: null, staff: undefined })
		);
		const text = textIn(doc);
		expect(text).toContain('SUB-TOTAL');
		expect(text).toContain('TOTAL AMOUNT');
		expect(text).toContain('FOR WARRANTY SERVICE:');
		expect(text).toContain('Signature over Printed Name');
		expect(text).toContain('Generated on');
	});
});

describe('buildDrPdf — warranty', () => {
	it('renders the FOR WARRANTY SERVICE heading and the verbatim client copy', async () => {
		const doc = await buildDrPdf(makeOrder());
		const flat = textFlat(doc);
		expect(flat).toContain('FOR WARRANTY SERVICE:');
		expect(flat).toContain(WARRANTY_TEXT.replace(/\s+/g, ' '));
	});
});

describe('buildDrPdf — signatures and footer', () => {
	it('renders three signature lines: Inventory, Received By, Branch Manager', async () => {
		const text = textIn(await buildDrPdf(makeOrder()));
		expect(text.match(/Signature over Printed Name/g)?.length).toBe(3);
		expect(text).toContain('Inventory');
		expect(text).toContain('Received By');
		expect(text).toContain('Branch Manager');
	});

	it('renders the report footer (Generated on + Page 1 of 1)', async () => {
		const text = textIn(await buildDrPdf(makeOrder()));
		expect(text).toContain('Generated on');
		expect(text).toContain('Page 1 of 1');
	});
});
