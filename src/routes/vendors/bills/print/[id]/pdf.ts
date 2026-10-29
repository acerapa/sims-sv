import autoTable from 'jspdf-autotable';
import type { jsPDF } from 'jspdf';
import {
	addReportFooter,
	capitalizeFirst,
	createReportDoc,
	drawField,
	drawNotes,
	ensureSpace,
	formatCurrencyPdf,
	formatDatePdf,
	tableFinalY
} from '$lib/utils/pdf';

export interface BillItemRow {
	name: string;
	quantity: string | number;
	cost: string | number;
	total_cost: string | number;
}

// Structural mirror of getBillWithItems() in $lib/server/db/queries/bills.ts —
// declared locally (no $lib/server import) so this module runs in plain Node/vitest.
export interface BillPrintData {
	id: number;
	supplier_name: string | null;
	po_reference: string | null;
	bill_date: string | Date;
	due_date: string | Date;
	notes: string | null;
	payment_type: string;
	check_number: string | null;
	bill_status: string;
	sub_total: string | number;
	discount: string | number;
	total: string | number;
	total_amount: string | number;
	paid_amount: string | number;
	po_items: BillItemRow[];
}

const toNumber = (value: string | number): number => {
	const parsed = parseFloat(String(value ?? '0')) || 0;
	return Number.isFinite(parsed) ? parsed : 0;
};

const billNumber = (id: number) => `BILL-00${id}`;

const paymentLabel = (bill: BillPrintData) => {
	const method = capitalizeFirst(bill.payment_type || '');
	return method === 'Check' && bill.check_number
		? `Check (No. ${bill.check_number})`
		: method || '—';
};

export async function buildBillPdf(bill: BillPrintData): Promise<jsPDF> {
	const { doc, margin, pageWidth, pageHeight, startY } = await createReportDoc({
		title: 'Bill',
		subtitle: `${billNumber(bill.id)} · ${capitalizeFirst(bill.bill_status || '')}`
	});
	const colWidth = (pageWidth - margin * 2) / 2;

	let y = drawField(doc, margin, colWidth, 'SUPPLIER', bill.supplier_name || '—', startY);
	drawField(doc, margin + colWidth, colWidth, 'LINKED PO', bill.po_reference || '—', startY);
	y = drawField(doc, margin, colWidth, 'BILL DATE', formatDatePdf(bill.bill_date), y);
	drawField(doc, margin + colWidth, colWidth, 'DUE DATE', formatDatePdf(bill.due_date), y);
	y = drawField(doc, margin, colWidth, 'PAYMENT', paymentLabel(bill), y);

	y = ensureSpace(doc, y, 48, pageHeight);
	y = drawNotes(doc, bill.notes ?? '', margin, y, pageWidth, pageHeight);

	// "Items" heading + rule (mirrors the preview)
	y = ensureSpace(doc, y, 60, pageHeight);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(11);
	doc.text('Items', margin, y + 14);
	y += 24;
	doc.setLineWidth(1);
	doc.line(margin, y, pageWidth - margin, y);
	y += 6;

	autoTable(doc, {
		startY: y,
		margin: { left: margin, right: margin, top: 10, bottom: 48 },
		head: [['Product', 'Qty', 'Unit Cost', 'Total']],
		body:
			bill.po_items.length > 0
				? bill.po_items.map((item) => [
						item.name,
						String(item.quantity),
						formatCurrencyPdf(item.cost),
						formatCurrencyPdf(item.total_cost)
					])
				: [
						[
							{
								content: 'No items on this purchase order.',
								colSpan: 4,
								styles: { halign: 'center' }
							}
						]
					],
		theme: 'grid',
		styles: {
			font: 'helvetica',
			fontSize: 9,
			cellPadding: 4,
			lineColor: 0,
			lineWidth: 0.5,
			overflow: 'linebreak',
			textColor: [17, 17, 17]
		},
		headStyles: { fillColor: [240, 240, 240], textColor: [17, 17, 17], fontStyle: 'bold' },
		columnStyles: {
			1: { halign: 'right', cellWidth: 40 },
			2: { halign: 'right', cellWidth: 90 },
			3: { halign: 'right', cellWidth: 90 }
		}
	});
	y = tableFinalY(doc, y + 12) + 12;

	// Totals + payment summary (right-aligned block, mirrors the preview)
	const total = toNumber(bill.total);
	const paid = toNumber(bill.paid_amount);
	const balance = Math.max(0, total - paid);
	const totals: [string, string, boolean][] = [
		['Subtotal', formatCurrencyPdf(bill.sub_total), false],
		['Discount', formatCurrencyPdf(bill.discount), false],
		['Total', formatCurrencyPdf(bill.total), true],
		['Amount Paid', formatCurrencyPdf(bill.paid_amount), false],
		['Balance', formatCurrencyPdf(balance), true]
	];

	autoTable(doc, {
		startY: ensureSpace(doc, y, 90, pageHeight),
		margin: { left: margin, right: margin, top: 0, bottom: 48 },
		body: totals.map(([label, value]) => [label, value]),
		width: (pageWidth - margin * 2) * 0.5,
		tableX: pageWidth - margin - (pageWidth - margin * 2) * 0.5,
		theme: 'plain' as const,
		styles: {
			font: 'helvetica',
			fontSize: 9,
			cellPadding: { top: 2, bottom: 2, left: 0, right: 0 },
			textColor: [17, 17, 17]
		},
		columnStyles: {
			1: { halign: 'right' }
		},
		rowStyles: Object.fromEntries(
			totals.map(([, , isBold], index) => [
				index,
				{ fontStyle: isBold ? ('bold' as const) : ('normal' as const) }
			])
		)
	});

	addReportFooter(doc);
	return doc;
}
