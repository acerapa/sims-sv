import { describe, expect, it } from 'vitest';
import { REPORT_MARGIN } from '../src/lib/utils/pdf';
import {
	buildDrPdf,
	drSpacerRows,
	formatDateShort,
	serialWPercent,
	totalWPercent,
	upWPercent,
	WARRANTY_TEXT,
	type DeliveryReceiptItem,
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

// n identical line items — item-count studies (page-break boundaries, paper sizes)
function items(n: number): DeliveryReceiptOrder['items'] {
	return Array.from({ length: n }, (_, i) => ({
		quantity: 1,
		unit_price: '1.00',
		total_price: '1.00',
		serial_number: null,
		product: { sales_description: `Item ${i + 1}` },
		package: undefined
	}));
}

describe('buildDrPdf — paper size (client 2026-11: letter and legal)', () => {
	it('defaults to letter portrait', async () => {
		const doc = await buildDrPdf(makeOrder());
		expect(doc.internal.pageSize.getWidth()).toBe(612);
		expect(doc.internal.pageSize.getHeight()).toBe(792);
	});

	it('builds a legal page (612 x 1008pt) when requested, still one page for a typical order', async () => {
		const doc = await buildDrPdf(makeOrder(), 'legal');
		expect(doc.internal.pageSize.getWidth()).toBe(612);
		expect(doc.internal.pageSize.getHeight()).toBe(1008);
		expect(doc.getNumberOfPages()).toBe(1);
	});

	it('stretches the table farther down a legal page so the warranty block still closes the page', async () => {
		const one = { items: (makeOrder().items ?? []).slice(0, 1) };
		const letterTop = startYAt(await buildDrPdf(makeOrder(one)), 'FOR WARRANTY SERVICE:');
		const legalTop = startYAt(await buildDrPdf(makeOrder(one), 'legal'), 'FOR WARRANTY SERVICE:');
		// legal adds 216pt of page height — the warranty anchor must follow it, not stay letter-anchored
		expect(legalTop).toBeGreaterThan(letterTop + 200);
	});

	it('fits a 30-item order on one legal page', async () => {
		const doc = await buildDrPdf(makeOrder({ items: items(30) }), 'legal');
		const text = textIn(doc);
		for (let i = 1; i <= 30; i++) expect(text).toContain(`Item ${i}`);
		expect(text).toContain('Branch Manager');
		expect(doc.getNumberOfPages()).toBe(1);
	});
});

describe('buildDrPdf — page breaks only when the table is genuinely long (client 2026-11)', () => {
	// repro: the signatures jumped to page 2 while ~15pt of page 1 still stood free
	it('keeps a 19-item receipt — table ending ~73% down — on one page', async () => {
		const doc = await buildDrPdf(makeOrder({ items: items(19) }));
		expect(doc.getNumberOfPages()).toBe(1);
		// the signature block's lowest text stays inside page 1's printable area
		expect(startYAt(doc, 'Branch Manager')).toBeLessThan(792 - 48);
	});

	it('lets a 20-item receipt flow to a second page, losing nothing', async () => {
		const doc = await buildDrPdf(makeOrder({ items: items(20) }));
		expect(doc.getNumberOfPages()).toBe(2);
		const text = textIn(doc);
		for (let i = 1; i <= 20; i++) expect(text).toContain(`Item ${i}`);
		expect(text).toContain('FOR WARRANTY SERVICE:');
		expect(text).toContain('Branch Manager');
	});
});

describe('drSpacerRows — paper format', () => {
	it('stretches short lists more on legal than on letter', () => {
		expect(drSpacerRows(3, 204, 'legal')).toBeGreaterThan(drSpacerRows(3, 204, 'letter'));
	});

	it('still returns 0 for genuinely long lists on legal', () => {
		expect(drSpacerRows(60, 204, 'legal')).toBe(0);
	});
});

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

	it('renders item money bare — prefix gone from item rows, kept on the totals (no peseta glyph)', async () => {
		const text = textIn(await buildDrPdf(makeOrder()));
		expect(text).toContain('2');
		expect(text).toContain('SN-1');
		// client 2026-11: item rows drop the currency prefix
		expect(text).toContain('100.00');
		expect(text).toContain('200.00');
		expect(text).not.toContain('Php 100.00');
		expect(text).not.toContain('Php 200.00');
		// …but SUB-TOTAL / TOTAL AMOUNT keep it (excluded from the change)
		expect(text).toContain('Php 282.95');
		expect(text).toContain('Php 1,999,602.30');
		expect(text).not.toContain('₱');
	});

	it('renders item rows with the small x padding, aligned with the totals rows', async () => {
		// client 2026-11-09: item text keeps the 5pt x inset (readability), same as the totals rows
		const doc = await buildDrPdf(makeOrder());
		const raw = Buffer.from(doc.output('arraybuffer')).toString('latin1');
		const xAt = (fragment: string): number => {
			const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const m = raw.match(new RegExp(String.raw`([\d.]+)\s+[\d.]+\s+Td\s*\n\(\s*${escaped}`));
			return m ? Number(m[1]) : NaN;
		};
		expect(xAt('Widget')).toBe(REPORT_MARGIN + 5);
		expect(xAt('SUB-TOTAL')).toBe(REPORT_MARGIN + 5);
	});

	it('packs item rows at the compact 14pt height, not the old 26pt', async () => {
		// client 2026-11-09: consecutive item rows are one ITEM_ROW_HEIGHT apart
		const doc = await buildDrPdf(makeOrder());
		const pitch = startYAt(doc, 'Kit') - startYAt(doc, 'Widget');
		expect(pitch).toBeCloseTo(14, 1);
	});

	it('sizes the UP and Total columns to the receipt amounts, with Item Description absorbing (table stays 531.9pt)', async () => {
		// the column edges are the vertical border ops in the stream; with the serial at its
		// 85.1pt floor, UP fits the widest unit price "100.00" (38pt) and Total fits the
		// "Php 1,999,602.30" totals-row value (81pt) — Item Description absorbs the freed width
		const doc = await buildDrPdf(makeOrder());
		const raw = Buffer.from(doc.output('arraybuffer')).toString('latin1');
		const verticalEdges = new Set<number>();
		for (const m of raw.matchAll(/([\d.]+)\s+([\d.]+)\s+m\s*\n\1\s+([\d.]+)\s*l/g)) {
			verticalEdges.add(Number(m[1]));
		}
		const hasEdge = (x: number) => [...verticalEdges].some((v) => Math.abs(v - x) < 0.01);
		expect(hasEdge(REPORT_MARGIN + 290.6)).toBe(true); // description/serial edge, 19pt wider than the fixed-width era
		expect(hasEdge(REPORT_MARGIN + 290.6 + 85.1 + 37.2)).toBe(true); // UP left edge
		expect(hasEdge(REPORT_MARGIN + 290.6 + 85.1 + 37.2 + 38)).toBe(true); // UP/Total edge
		expect(hasEdge(REPORT_MARGIN + 531.9)).toBe(true); // table right edge, invariant
		expect(hasEdge(REPORT_MARGIN + 271.6)).toBe(false); // the fixed-width description edge is gone
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
		expect(drSpacerRows(15)).toBe(2); // 2 spacers after the 2026-11 signature-reserve fix (90 → 77pt)
		expect(drSpacerRows(20)).toBe(0); // longer lists keep their natural multi-page flow
	});
});

describe('buildDrPdf — UP/Total column fit', () => {
	// client 2026-11: the fixed 56/82pt widths left a blank gap before the right-aligned
	// amounts — the columns now fit the receipt's widest value and Item Description absorbs
	const small: DeliveryReceiptItem[] = makeOrder().items ?? [];

	it('shrinks UP and Total below the old fixed widths for small amounts (Item Description absorbs)', () => {
		expect(upWPercent(small)).toBeLessThan(10.5); // 7.1% (38pt) vs the old fixed 56pt
		expect(totalWPercent(small, 282.95, '1999602.30')).toBeLessThan(15.4); // 15.2% (81pt) vs the old fixed 82pt
	});

	it('grows the columns back for wide amounts so nothing clips', async () => {
		const big: DeliveryReceiptItem[] = [
			{
				quantity: 1,
				unit_price: '999999.99',
				total_price: '999999.99',
				serial_number: null,
				product: { sales_description: 'Big item' },
				package: undefined
			}
		];
		expect(upWPercent(big)).toBeCloseTo((55 / 531.9) * 100, 1); // "999,999.99" + 10pt padding
		expect(totalWPercent(big, 999999.99, '999999.99')).toBeCloseTo((73 / 531.9) * 100, 1); // "Php 999,999.99" totals row
		const text = textIn(await buildDrPdf(makeOrder({ items: big })));
		expect(text).toContain('999,999.99');
		expect(text).toContain('Php 999,999.99');
	});

	it('keeps the Total column wide enough for the "Php …" grand-total row when the line items are small', () => {
		// the Total column must fit "Php <total_cost>" even when the line-item amounts are tiny
		const items = small.slice(0, 1);
		expect(totalWPercent(items, 200, '1999602.30')).toBeCloseTo((81 / 531.9) * 100, 1);
		expect(upWPercent(items)).toBeCloseTo((38 / 531.9) * 100, 1); // "100.00" + 10pt padding
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

	it('keeps the totals rows clean: no internal vertical dividers, outer edges intact', async () => {
		// client 2026-11-09: label/amount rows read without the column grid inside them
		const doc = await buildDrPdf(makeOrder());
		const at = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
		expect(at).toBeDefined();
		const finalY = at!.finalY;
		const totalTop = finalY - 2 * 26; // SUB-TOTAL + TOTAL AMOUNT rows
		// stream coordinates are bottom-origin: the block spans 792-finalY .. 792-totalTop
		const yMin = 792 - finalY;
		const yMax = 792 - totalTop;
		const raw = Buffer.from(doc.output('arraybuffer')).toString('latin1');
		let internal = 0;
		let leftEdge = 0;
		let rightEdge = 0;
		for (const m of raw.matchAll(/([\d.]+)\s+([\d.]+)\s+m\s*\n\1\s+([\d.]+)\s*l/g)) {
			const x = Number(m[1]);
			const y1 = Number(m[2]);
			const y2 = Number(m[3]);
			if (Math.max(y1, y2) <= yMin || Math.min(y1, y2) >= yMax) continue; // not inside the block
			if (Math.abs(x - 40) < 0.5)
				leftEdge++; // table left edge (margin)
			else if (Math.abs(x - 571.9) < 0.5)
				rightEdge++; // table right edge (margin + 531.9)
			else internal++;
		}
		expect(internal).toBe(0);
		expect(leftEdge).toBeGreaterThan(0);
		expect(rightEdge).toBeGreaterThan(0);
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
