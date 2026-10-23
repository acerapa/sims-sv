import autoTable from 'jspdf-autotable';
import type { jsPDF } from 'jspdf';
import {
	addReportFooter,
	createReportDoc,
	dateRangeLabel,
	ensureSpace,
	formatCurrencyPdf,
	formatDatePdf,
	safeNum,
	tableFinalY
} from '$lib/utils/pdf';

const EMPTY_RANGE_TEXT = 'No invoices found for the selected date range.';

export interface SbrItem {
	item_name: string | null;
	item_quantity: string | number | null;
	item_price: string | number;
	item_total: string | number;
}

export interface SbrInvoice {
	invoice_id: string | number;
	invoice_date: Date | string;
	invoice_notes: string | null;
	items: SbrItem[];
	subtotal: string | number;
	// placeholder until the balance definition is finalized
	balance: string | number;
}

export interface SbrRep {
	rep_name: string;
	invoices: SbrInvoice[];
	subtotal: string | number;
}

export interface SalesByRepData {
	detailed: SbrRep[];
}

function drawItemsTable(doc: jsPDF, invoice: SbrInvoice, margin: number, y: number): number {
	autoTable(doc, {
		startY: y,
		margin: { left: margin, right: margin, top: 10, bottom: 48 },
		head: [['Item Description', 'Qty', 'Sales Price', 'Amount', 'Balance']],
		body: invoice.items.map((item) => [
			item.item_name || '',
			item.item_quantity == null ? '' : String(item.item_quantity),
			formatCurrencyPdf(item.item_price),
			formatCurrencyPdf(item.item_total),
			formatCurrencyPdf(invoice.balance)
		]),
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
			1: { halign: 'right', cellWidth: 50 },
			2: { halign: 'right', cellWidth: 90 },
			3: { halign: 'right', cellWidth: 100 },
			4: { halign: 'right', cellWidth: 100 }
		}
	});
	const finalY = tableFinalY(doc, y);
	return finalY + 8;
}

function drawRepSections(
	doc: jsPDF,
	detailed: SbrRep[],
	margin: number,
	pageWidth: number,
	pageHeight: number,
	y: number
): number {
	if (detailed.length === 0) {
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(10);
		doc.setTextColor(102, 102, 102);
		doc.text(EMPTY_RANGE_TEXT, 50, ensureSpace(doc, y, 40, pageHeight) + 20, { align: 'center' });
		doc.setTextColor(0, 0, 0);
		return y + 40;
	}

	let cursor = y;
	detailed.forEach((rep, idx) => {
		if (idx > 0) {
			doc.addPage();
			cursor = 48;
		}

		cursor = ensureSpace(doc, cursor, 60, pageHeight);

		// section heading — the preview's <h3 class="print-section-title">
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(12);
		doc.text(rep.rep_name, margin, cursor + 14);
		cursor += 24;

		for (const invoice of rep.invoices) {
			// invoice header line — the preview's .print-po-header (ref · date · notes)
			cursor = ensureSpace(doc, cursor, 30, pageHeight);
			doc.setFont('helvetica', 'bold');
			doc.setFontSize(9);
			doc.text(`INV-${invoice.invoice_id}`, margin, cursor + 8);
			doc.setFont('helvetica', 'normal');
			const notes = invoice.invoice_notes ? `  –  ${invoice.invoice_notes}` : '';
			doc.text(`${formatDatePdf(invoice.invoice_date)}${notes}`, margin, cursor + 18);
			cursor += 28;

			cursor = drawItemsTable(doc, invoice, margin, cursor);
		}

		// right-aligned bold "Subtotal: Php …" — the preview's .print-vendor-subtotal
		cursor = ensureSpace(doc, cursor, 20, pageHeight);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(10);
		doc.text(`Subtotal: ${formatCurrencyPdf(rep.subtotal)}`, pageWidth - margin, cursor + 12, {
			align: 'right'
		});
		cursor += 24;
	});

	// bold "TOTAL" grand line — the preview's tfoot
	cursor = ensureSpace(doc, cursor, 20, pageHeight);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(10);
	const grandTotal = detailed.reduce((acc, rep) => acc + safeNum(rep.subtotal), 0);
	doc.text(`TOTAL: ${formatCurrencyPdf(grandTotal)}`, pageWidth - margin, cursor + 12, { align: 'right' });
	cursor += 24;

	return cursor;
}

export async function buildSalesByRepPdf(
	data: SalesByRepData,
	filters?: { from?: string | null; to?: string | null }
): Promise<jsPDF> {
	const { doc, margin, pageWidth, pageHeight, startY } = await createReportDoc({
		title: 'Sales by Representative',
		subtitle: dateRangeLabel(filters)
	});

	drawRepSections(doc, data.detailed, margin, pageWidth, pageHeight, startY);

	addReportFooter(doc);
	return doc;
}
