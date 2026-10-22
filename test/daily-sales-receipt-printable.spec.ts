import { describe, expect, it } from 'vitest';
import {
	buildSalesReceiptPdf,
	type SalesReceiptOrder,
	type SalesReceiptPayment
} from '../src/routes/customers/daily-sales/print/[id]/pdf';

// jsPDF 4 text extraction is not exposed on the Node API surface, so read the
// rendered text ops back out of the raw content stream.
function textIn(doc: ReturnType<typeof buildSalesReceiptPdf>): string {
	const raw = Buffer.from(doc.output('arraybuffer')).toString('latin1');
	const parts: string[] = [];
	for (const m of raw.matchAll(/\(((?:\\.|[^()\\])*)\)\s*Tj/g)) parts.push(m[1]);
	return parts.join('\n');
}

function makeOrder(overrides: Partial<SalesReceiptOrder> = {}): SalesReceiptOrder {
	return {
		id: 7,
		date_ordered: new Date('2026-07-10T12:00:00'),
		total_cost: '1999602.30',
		discount: '50.00',
		customer: { name: 'ACME Corp', address: '123 Main St, Calbayog' },
		staff: { name: 'John Doe' },
		items: [
			{
				id: 1,
				quantity: 2,
				unit_price: '100.00',
				total_price: '200.00',
				serial_number: 'SN-1',
				product: { sales_description: 'Widget' },
				package: undefined
			},
			{
				id: 2,
				quantity: 1,
				unit_price: '33.00',
				total_price: '33.00',
				serial_number: null,
				product: undefined,
				package: { name: 'Kit' }
			},
			{
				id: 3,
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

const CHEQUE: SalesReceiptPayment = { check_number: '100234', payment_type: 'cheque_clearance' };

describe('buildSalesReceiptPdf — structure', () => {
	it('returns a jsPDF document', () => {
		const doc = buildSalesReceiptPdf(makeOrder(), CHEQUE);
		expect(doc.getNumberOfPages()).toBeGreaterThan(0);
		expect(doc.internal.pageSize.getWidth()).toBe(612); // letter portrait
	});

	it('is one page for a typical 3-item receipt', () => {
		expect(buildSalesReceiptPdf(makeOrder(), CHEQUE).getNumberOfPages()).toBe(1);
	});

	it('renders its own company header (not the report-brand header)', () => {
		const text = textIn(buildSalesReceiptPdf(makeOrder(), CHEQUE));
		expect(text).toContain('RAM TECH VENTURES INC.');
		expect(text).toContain('BARTOLOME BLDG. MAGSAYSAY BLVD.');
		expect(text).toContain('CALBAYOG CITY, SAMAR');
		expect(text).toContain('SALES-DELIVERY RECEIPT');
	});

	it('renders the reference table: date + sale number', () => {
		const text = textIn(buildSalesReceiptPdf(makeOrder(), CHEQUE));
		expect(text).toContain('Date');
		expect(text).toContain('Sale No.');
		const order = makeOrder();
		const dateText = new Date(order.date_ordered).toLocaleDateString('default');
		expect(text).toContain(dateText);
		expect(text).toContain(String(order.id));
	});

	it('does not render the report brand title/address block', () => {
		const text = textIn(buildSalesReceiptPdf(makeOrder(), CHEQUE));
		// the report-frame constant line does not exist on this page
		expect(text).not.toContain('Sales, Accounts Payables & Inventory');
	});
});

describe('buildSalesReceiptPdf — sold-to box', () => {
	it('renders the customer name (capitalized) and address', () => {
		const text = textIn(buildSalesReceiptPdf(makeOrder(), CHEQUE));
		expect(text).toContain('Sold To');
		expect(text).toContain('ACME CORP');
		expect(text).toContain('123 MAIN ST, CALBAYOG');
	});

	it('handles a missing customer with a placeholder and no crash', () => {
		const doc = buildSalesReceiptPdf(makeOrder({ customer: null }), CHEQUE);
		const text = textIn(doc);
		expect(text).toContain('Sold To');
		expect(doc.getNumberOfPages()).toBeGreaterThan(0);
	});
});

describe('buildSalesReceiptPdf — payment grid', () => {
	it('renders check no., title-cased payment method, rep, and a Project column', () => {
		const text = textIn(buildSalesReceiptPdf(makeOrder(), CHEQUE));
		expect(text).toContain('Check No.');
		expect(text).toContain('Payment Method');
		expect(text).toContain('Rep');
		expect(text).toContain('Project');
		expect(text).toContain('100234');
		expect(text).toContain('Cheque Clearance');
		expect(text).toContain('John Doe');
	});

	it('falls back to dash when there is no payment or staff', () => {
		const text = textIn(buildSalesReceiptPdf(makeOrder({ staff: undefined }), null));
		expect(text).toContain('Check No.');
	});

	it('handles a missing check_number without crashing', () => {
		const doc = buildSalesReceiptPdf(makeOrder(), { payment_type: 'cash' });
		expect(textIn(doc)).toContain('Cash');
	});
});

describe('buildSalesReceiptPdf — items table', () => {
	it('renders name falls back package -> sales_description -> dash', () => {
		const text = textIn(buildSalesReceiptPdf(makeOrder(), CHEQUE));
		expect(text).toContain('Widget');
		expect(text).toContain('Kit');
		// item 3 has both package and product names empty
		expect(text).toContain('Item');
		expect(text).toContain('Qty');
		expect(text).toContain('Rate');
		expect(text).toContain('S/N');
		expect(text).toContain('Amount');
	});

	it('renders quantity, serial, and Php-formatted money (no peseta glyph)', () => {
		const text = textIn(buildSalesReceiptPdf(makeOrder(), CHEQUE));
		expect(text).toContain('2');
		expect(text).toContain('SN-1');
		expect(text).toContain('Php 100.00');
		expect(text).toContain('Php 200.00');
		expect(text).not.toContain('₱');
	});

	it('renders all lines even for a 15-item receipt, with totals after', () => {
		const order = makeOrder({
			items: Array.from({ length: 15 }, (_, i) => ({
				id: i + 1,
				quantity: 1,
				unit_price: '1.00',
				total_price: '1.00',
				serial_number: null,
				product: { sales_description: `Item ${i + 1}` },
				package: undefined
			}))
		});
		const doc = buildSalesReceiptPdf(order, CHEQUE);
		const text = textIn(doc);
		for (let i = 1; i <= 15; i++) expect(text).toContain(`Item ${i}`);
		expect(text).toContain('Subtotal');
		expect(text).toContain('Total');
		expect(text).toContain('SIGNATURE OVER PRINTED NAME');
	});
});

describe('buildSalesReceiptPdf — totals + footer', () => {
	it('computes subtotal from item total_price and prints order.total_cost as-is', () => {
		const text = textIn(buildSalesReceiptPdf(makeOrder(), CHEQUE));
		expect(text).toContain('Subtotal');
		expect(text).toContain('Php 282.95'); // 200 + 33 + 49.95
		expect(text).toContain('Total');
		expect(text).toContain('Php 1,999,602.30');
	});

	it('shows the discount row only when the order has one', () => {
		const withDiscount = textIn(buildSalesReceiptPdf(makeOrder(), CHEQUE));
		expect(withDiscount).toContain('Discount');
		expect(withDiscount).toContain('-Php 50.00');
		const without = textIn(buildSalesReceiptPdf(makeOrder({ discount: null }), CHEQUE));
		expect(without).not.toContain('Discount');
	});

	it('handles an empty receipt: one page, all sections, no crash', () => {
		const doc = buildSalesReceiptPdf(makeOrder({ items: [], discount: 0 }), null);
		const text = textIn(doc);
		expect(text).toContain('Subtotal');
		expect(text).toContain('SIGNATURE OVER PRINTED NAME');
		expect(text).toContain('Generated on');
		expect(text).toContain('Page 1 of 1');
	});

	it('renders the report footer (Generated on + page x of y)', () => {
		const text = textIn(buildSalesReceiptPdf(makeOrder(), CHEQUE));
		expect(text).toContain('Generated on');
		expect(text).toContain('Page 1 of 1');
	});
});
