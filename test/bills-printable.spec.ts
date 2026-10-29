import { describe, expect, it } from 'vitest';
import { buildBillPdf, type BillPrintData } from '../src/routes/vendors/bills/print/[id]/pdf';
import { formatCurrencyPdf as currency, formatDatePdf as dateFmt } from '../src/lib/utils/pdf';

// jsPDF 4 removed getText()/getTextContent() in favor of doc.canvas, so pull rendered
// strings straight out of the content stream (same approach as ibrr-printable.spec.ts).
function textIn(doc: { output: () => string }): string {
	const content = doc.output('arraybuffer') as ArrayBuffer;
	const text = new TextDecoder('latin1').decode(new Uint8Array(content));
	const parts: string[] = [];
	const re = /\(((?:\\.|[^()\\])*)\)\s*Tj/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(text))) parts.push(m[1]);
	return parts.join('\n');
}

const sample: BillPrintData = {
	id: 12,
	supplier_name: 'Sunnyside Foods',
	po_reference: 'PO-2025-0142',
	bill_date: new Date(2025, 9, 7),
	due_date: new Date(2025, 11, 6),
	notes: 'Two pickup windows agreed with vendor.',
	payment_type: 'check',
	check_number: '22913',
	bill_status: 'partial',
	sub_total: '15300.00',
	discount: '300.00',
	total: '15000.00',
	total_amount: '15000.00',
	paid_amount: '4000.00',
	po_items: [
		{ name: 'Wireless Keyboard', quantity: 12, cost: '1250.00', total_cost: '15000.00' },
		{ name: 'Logitech M185', quantity: 3, cost: '899.00', total_cost: '2697.00' }
	]
};

describe('buildBillPdf', () => {
	it('renders title, Bill No with status, supplier, PO reference and both dates', async () => {
		const text = textIn(await buildBillPdf(sample));
		expect(text).toContain('Bill');
		expect(text).toContain('BILL-0012');
		expect(text).toContain('Partial');
		expect(text).toContain('Sunnyside Foods');
		expect(text).toContain('PO-2025-0142');
		expect(text).toContain(dateFmt(new Date(2025, 9, 7)));
		expect(text).toContain(dateFmt(new Date(2025, 11, 6)));
		expect(text).toContain('Check \\(No. 22913\\)');
	});

	it('renders item rows with Php currency and the subtotal/discount/total block', async () => {
		const text = textIn(await buildBillPdf(sample));
		expect(text).toContain('Wireless Keyboard');
		expect(text).toContain('Logitech M185');
		expect(text).toContain(currency('15000.00'));
		expect(text).toContain(currency('15300.00'));
		expect(text).toContain(currency('300.00'));
	});

	it('computes Balance = Total − Paid, floors at zero, and shows cash without a check number', async () => {
		const partial = textIn(await buildBillPdf(sample));
		expect(partial).toContain(currency('11000.00'));

		const fullyPaid = textIn(
			await buildBillPdf({ ...sample, paid_amount: '15000.00', bill_status: 'paid' })
		);
		expect(fullyPaid).toContain(currency('0.00'));

		const overpaid = textIn(await buildBillPdf({ ...sample, paid_amount: '20000.00' }));
		expect(overpaid).toContain(currency('0.00'));

		const cash = textIn(
			await buildBillPdf({ ...sample, payment_type: 'cash', check_number: null })
		);
		expect(cash).toContain('Cash');
		expect(cash).not.toContain('Check \\(No.');
	});

	it('shows the empty-items placeholder instead of a blank table', async () => {
		const text = textIn(await buildBillPdf({ ...sample, po_items: [] }));
		expect(text).toContain('No items on this purchase order.');
		expect(text).toContain('Product');
	});

	it('keeps entered notes verbatim and uses the --- placeholder when blank', async () => {
		const entered = textIn(
			await buildBillPdf({ ...sample, notes: 'Paid on delivery — half by check.' })
		);
		expect(entered).toContain('Paid on delivery — half by check.');

		const blank = textIn(await buildBillPdf({ ...sample, notes: '' }));
		expect(blank).toContain('---');
	});
});
