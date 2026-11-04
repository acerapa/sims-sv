import { describe, expect, it } from 'vitest';
import {
	buildDrPdf,
	drSpacerRows,
	formatDateShort,
	serialWPercent,
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

// Baseline Y of one text's first content-stream op ("x y Td\n(text)"), so tests can
// assert vertical placement — e.g. that the warranty block was pushed to the page bottom.
function startYAt(doc: Awaited<ReturnType<typeof buildDrPdf>>, fragment: string): number {
	const raw = Buffer.from(doc.output('arraybuffer')).toString('latin1');
	const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const m = raw.match(new RegExp(String.raw`([\d.]+)\s+([\d.]+)\s+Td\s*\n\(\s*${escaped}`));
	if (!m) return NaN;
	// stream coordinates are bottom-origin; flip to the top-origin axis the layout code uses
	return doc.internal.pageSize.getHeight() - Number(m[2]);
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
		expect(text).toContain(formatDateShort(order.date_ordered));
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

	it('sizes the box to its content: short address stays small, a long one grows it', async () => {
		const boxH = (doc: unknown) => {
			// the Name/Address box is encoded in the stream as "40. <y> 255. -<H>. re"
			const raw = Buffer.from(
				(doc as { output: (t: string) => ArrayBuffer }).output('arraybuffer')
			).toString('latin1');
			return Number(raw.match(/40\. [^m]* 255\. -([\d]+)\. re/)?.[1]);
		};
		expect(boxH(await buildDrPdf(makeOrder()))).toBe(58); // 1-line address -> 36 + 12 + 10
		const addr =
			'12345 Very Long Street, Brgy. Poblacion 1st Purok, Calbayog City, Samar 6100, Philippines';
		const grown = boxH(
			await buildDrPdf(makeOrder({ customer: { name: 'ACME Corp', address: addr } }))
		);
		expect(grown).toBeGreaterThan(58); // fits the content instead of wasting space or clipping it
		// and the warranty block still closes the page at the bottom (spacers adapt to the box height)
		const warranty = startYAt(
			await buildDrPdf(
				makeOrder({
					customer: { name: 'ACME Corp', address: addr },
					items: makeOrder().items.slice(0, 1)
				})
			),
			'FOR WARRANTY SERVICE:'
		);
		expect(warranty).toBeGreaterThan(400);
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

	it('stretches with blank rows so the warranty block closes the page at the same spot for any short list', async () => {
		const one = startYAt(
			await buildDrPdf(makeOrder({ items: makeOrder().items.slice(0, 1) })),
			'FOR WARRANTY SERVICE:'
		);
		const three = startYAt(await buildDrPdf(makeOrder()), 'FOR WARRANTY SERVICE:');
		expect(one).not.toBeNaN();
		expect(Math.abs(one - three)).toBeLessThan(6); // the table absorbs the space, not the warranty block
		expect(three).toBeGreaterThan(450); // bottom region of a 792pt letter page (was ≈430 un-stretched)
		expect(drSpacerRows(1)).toBeGreaterThan(0);
		expect(drSpacerRows(15)).toBe(0); // long lists keep their natural multi-page flow
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

	it('rules the totals block: top, between, and bottom borders (26pt apart, full table width)', async () => {
		const doc = await buildDrPdf(makeOrder());
		const raw = Buffer.from(doc.output('arraybuffer')).toString('latin1');
		// stream "x y m / x2 y l" pairs are horizontal rules; the totals block contributes three,
		// 26pt apart, spanning the table width (x 40 to ~571.9)
		const rules: number[] = [];
		for (const m of raw.matchAll(/([\d.]+)\s+([\d.]+)\s+m\s*\n([\d.]+)\s+(\2)\s*l/g)) {
			const left = Number(m[1]);
			const right = Number(m[3]);
			if (Math.abs(left - 40) < 2 && right - left > 450) rules.push(Number(m[2]));
		}
		rules.sort((a, b) => a - b);
		let consecutive = 0;
		for (let i = 1; i < rules.length; i++) {
			if (Math.abs(rules[i] - rules[i - 1] - 26) < 0.5) consecutive++;
		}
		expect(consecutive).toBeGreaterThanOrEqual(2); // three co-equipspaced rules = the bordered totals block
	});

	it('sizes the Serial No. column to the longest value, with Item Description absorbing the room', async () => {
		// serialWPercent() builds its own pt-unit doc internally: 16% = the old fixed width
		expect(serialWPercent(['SN-1', 'SN-2'])).toBeCloseTo(16, 0); // unchanged when values are short (floor)
		const long = 'RAMTECHSN2026X7K9P2M4Q1';
		expect(serialWPercent(['SN-1', long])).toBeGreaterThan(16); // widened for a long serial
		expect(serialWPercent(['R'.repeat(120)])).toBeLessThanOrEqual(30); // capped so it wraps, not squashes
		// the receipt still builds cleanly with a long serial
		const order = makeOrder({ items: makeOrder().items.slice(0, 1) });
		(order.items as Array<Record<string, unknown>>)[0].serial_number = long;
		expect(textIn(await buildDrPdf(order))).toContain(long);
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
