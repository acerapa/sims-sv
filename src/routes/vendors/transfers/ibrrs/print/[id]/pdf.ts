import autoTable from 'jspdf-autotable';
import type { jsPDF } from 'jspdf';
import {
	addReportFooter,
	createReportDoc,
	drawField,
	drawNotes,
	drawSignatures,
	ensureSpace,
	formatCurrencyPdf,
	tableFinalY
} from '#lib/utils/pdf.ts';

export interface IbrrItem {
	// leftJoin(products) in getIBRRById — can be null for orphans
	purchase_description: string | null;
	quantity: string | number;
	cost: string | number;
	total_cost: string | number;
}

export interface IbrrPrintData {
	id: number;
	str_id: number | null;
	source_store_name: string | null;
	notes: string | null;
	items: IbrrItem[];
}

export async function buildIbrrPdf(ibrr: IbrrPrintData): Promise<jsPDF> {
	const { doc, margin, pageWidth, pageHeight, startY } = await createReportDoc({
		title: 'Inter-Branch Receiving Report'
	});
	const colWidth = (pageWidth - margin * 2) / 2;

	let y = drawField(doc, margin, colWidth, 'IBRR REFERENCE NO.', `IBRR-${ibrr.id}`, startY);
	drawField(
		doc,
		margin + colWidth,
		colWidth,
		'STR REFERENCE NO.',
		`STR-${ibrr.str_id ?? ''}`,
		startY
	);
	y = drawField(doc, margin, colWidth, 'SOURCE STORE', ibrr.source_store_name ?? '', y);

	y = ensureSpace(doc, y + 40, 40, pageHeight);
	y = drawNotes(doc, ibrr.notes ?? '', margin, y, pageWidth, pageHeight);

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
		head: [['Product', 'Quantity', 'Cost', 'Total Cost']],
		body:
			ibrr.items.length > 0
				? ibrr.items.map((item) => [
						item.purchase_description,
						String(item.quantity),
						formatCurrencyPdf(item.cost),
						formatCurrencyPdf(item.total_cost)
					])
				: [
						[
							{
								content: 'No items found for this Inter-Branch Receiving Report.',
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
			1: { halign: 'right', cellWidth: 60 },
			2: { halign: 'right', cellWidth: 80 },
			3: { halign: 'right', cellWidth: 90 }
		}
	});

	// Client: same sign-off block as the sales-order Delivery Receipt — Inventory /
	// Received By on one line, Branch Manager below; the preview mirrors it.
	y = tableFinalY(doc, y) + 20;
	y = ensureSpace(doc, y, 90, pageHeight);
	drawSignatures(doc, y);

	addReportFooter(doc);
	return doc;
}
