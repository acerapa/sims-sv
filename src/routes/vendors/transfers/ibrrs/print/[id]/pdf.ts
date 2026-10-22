import autoTable from 'jspdf-autotable';
import type { jsPDF } from 'jspdf';
import { addReportFooter, createReportDoc } from '$lib/utils/pdf';

// Standard jsPDF fonts have no ₱ glyph, so money renders as "Php" (same as inventory/print/pdf.ts)
function formatCurrencyPdf(value: string | number): string {
	const num = typeof value === 'string' ? parseFloat(value || '0') : value;
	return `Php ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// #666 — matches the preview's muted-foreground labels
const LABEL_COLOR: [number, number, number] = [102, 102, 102];

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

/** Draws a `LABEL` over a value with a muted underline (mirrors the preview's bordered fields). */
function drawField(doc: jsPDF, x: number, width: number, label: string, value: string, y: number): number {
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(7);
	doc.setTextColor(...LABEL_COLOR);
	doc.text(label, x, y);
	doc.setTextColor(0, 0, 0);
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(10);
	doc.text(value, x, y + 12);
	doc.setDrawColor(153, 153, 153);
	doc.setLineWidth(0.5);
	doc.line(x, y + 16, x + width, y + 16);
	doc.setDrawColor(0, 0, 0);
	return y + 26;
}

function drawNotesLine(doc: jsPDF, line: string, margin: number, y: number, pageHeight: number): number {
	if (y + 12 > pageHeight - 48) {
		doc.addPage();
		y = 48;
	}
	doc.text(line, margin, y);
	return y + 12;
}

function drawNotes(
	doc: jsPDF,
	notes: string,
	margin: number,
	y: number,
	pageWidth: number,
	pageHeight: number
): number {
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(7);
	doc.setTextColor(...LABEL_COLOR);
	doc.text('NOTES', margin, y);
	doc.setTextColor(0, 0, 0);
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(10);
	// falsy → '---', matching the preview's truthy check
	const lines: string[] = doc.splitTextToSize(notes || '---', pageWidth - margin * 2);
	y += 12;
	for (const line of lines) {
		// uncapped free text — paginate explicitly rather than rely on jsPDF's auto-paging
		y = drawNotesLine(doc, line, margin, y, pageHeight);
	}
	return y + 8;
}

function ensureSpace(doc: jsPDF, y: number, needed: number, pageHeight: number): number {
	// 48pt bottom band stays free for the report footer
	if (y + needed > pageHeight - 48) {
		doc.addPage();
		return 48;
	}
	return y;
}

export function buildIbrrPdf(ibrr: IbrrPrintData): jsPDF {
	const { doc, margin, pageWidth, pageHeight, startY } = createReportDoc({
		title: 'Inter-Branch Receiving Report'
	});
	const colWidth = (pageWidth - margin * 2) / 2;

	let y = drawField(doc, margin, colWidth, 'IBRR REFERENCE NO.', `IBRR-${ibrr.id}`, startY);
	drawField(doc, margin + colWidth, colWidth, 'STR REFERENCE NO.', `STR-${ibrr.str_id ?? ''}`, startY);
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
				: [[{ content: 'No items found for this Inter-Branch Receiving Report.', colSpan: 4, styles: { halign: 'center' } }]],
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

	addReportFooter(doc);
	return doc;
}
