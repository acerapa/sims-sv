import autoTable from 'jspdf-autotable';
import type { jsPDF } from 'jspdf';
import {
	addReportFooter,
	createReportDoc,
	drawField,
	drawNotes,
	ensureSpace,
	formatCurrencyPdf,
	formatDatePdf
} from '$lib/utils/pdf';

export interface RmaItem {
	// leftJoin(products) in getRMAById — can be null for orphans
	purchase_description: string | null;
	// serial-tracked products only; blank for non-serial items
	serial_number: string | null;
	quantity: string | number;
	cost: string | number;
	total_cost: string | number;
}

export interface RmaPrintData {
	id: number;
	supplier_name: string | null;
	date_returned: Date;
	notes: string | null;
	items: RmaItem[];
}

export async function buildRmaPdf(rma: RmaPrintData): Promise<jsPDF> {
	const { doc, margin, pageWidth, pageHeight, startY } = await createReportDoc({
		title: 'Return Merchandise Authorization'
	});
	const colWidth = (pageWidth - margin * 2) / 2;

	let y = drawField(doc, margin, colWidth, 'RMA REFERENCE NO.', `RMA-${rma.id}`, startY);
	drawField(doc, margin + colWidth, colWidth, 'TRANSFER DATE', formatDatePdf(rma.date_returned), startY);
	y = drawField(doc, margin, colWidth, 'SUPPLIER', rma.supplier_name ?? '', y);

	y = ensureSpace(doc, y + 40, 40, pageHeight);
	y = drawNotes(doc, rma.notes ?? '', margin, y, pageWidth, pageHeight);

	// "Items Received" heading + rule (mirrors the <p> + <hr> pair in the preview)
	y = ensureSpace(doc, y, 60, pageHeight);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(11);
	doc.text('Items Received', margin, y + 14);
	y += 24;
	doc.setLineWidth(1);
	doc.line(margin, y, pageWidth - margin, y);
	y += 6;

	autoTable(doc, {
		startY: y,
		margin: { left: margin, right: margin, top: 10, bottom: 48 },
		head: [['Product', 'Serial Number', 'Quantity', 'Cost', 'Total Cost']],
		body:
			rma.items.length > 0
				? rma.items.map((item) => [
						item.purchase_description,
						item.serial_number || '--',
						String(item.quantity),
						formatCurrencyPdf(item.cost),
						formatCurrencyPdf(item.total_cost)
					])
				: [[{ content: 'No items found for this RMA.', colSpan: 5, styles: { halign: 'center' } }]],
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
			2: { halign: 'right', cellWidth: 55 },
			3: { halign: 'right', cellWidth: 70 },
			4: { halign: 'right', cellWidth: 80 }
		}
	});

	addReportFooter(doc);
	return doc;
}
