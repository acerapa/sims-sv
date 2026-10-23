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

export interface StrItemSource {
	item_description: string;
	serial_numbers: string[];
	serial_number?: string;
	quantity: string | number;
	cost: string | number;
	total_cost: string | number;
}

export interface StrItemRow {
	item_description: string;
	serial_number?: string;
	quantity: string | number;
	cost: string | number;
	total_cost: string | number;
}

export interface StrPrintData {
	id: number;
	transfer_date: Date;
	store_name: string | null;
	notes: string | null;
	items: StrItemSource[];
}

/**
 * Serial-tracked items arrive as one product line holding N serials; the
 * report prints one line per serial at quantity 1 (mirrors the preview).
 */
export function expandStrItems(items: StrItemSource[]): StrItemRow[] {
	const rows: StrItemRow[] = [];
	for (const item of items) {
		if (item.serial_numbers.length > 1) {
			for (const serial of item.serial_numbers) {
				rows.push({
					item_description: item.item_description,
					serial_number: serial,
					quantity: 1,
					cost: item.cost,
					// single-serial lines total at the unit cost
					total_cost: item.cost
				});
			}
		} else {
			rows.push({
				item_description: item.item_description,
				serial_number: item.serial_number,
				quantity: item.quantity,
				cost: item.cost,
				total_cost: item.total_cost
			});
		}
	}
	return rows;
}

export async function buildStrPdf(str: StrPrintData): Promise<jsPDF> {
	const { doc, margin, pageWidth, pageHeight, startY } = await createReportDoc({ title: 'Stock Transfer Report' });
	const colWidth = (pageWidth - margin * 2) / 2;

	let y = drawField(doc, margin, colWidth, 'STR REFERENCE NO.', `STR-${str.id}`, startY);
	drawField(doc, margin + colWidth, colWidth, 'TRANSFER DATE', formatDatePdf(str.transfer_date), startY);
	y = drawField(doc, margin, colWidth, 'DESTINATION', str.store_name ?? '', y);

	y = ensureSpace(doc, y + 40, 40, pageHeight);
	y = drawNotes(doc, str.notes ?? '', margin, y, pageWidth, pageHeight);

	// "Items Received" heading + rule (mirrors the <p> + <hr> pair in the preview)
	y = ensureSpace(doc, y, 60, pageHeight);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(11);
	doc.text('Items Received', margin, y + 14);
	y += 24;
	doc.setLineWidth(1);
	doc.line(margin, y, pageWidth - margin, y);
	y += 6;

	const rows = expandStrItems(str.items);
	autoTable(doc, {
		startY: y,
		margin: { left: margin, right: margin, top: 10, bottom: 48 },
		head: [['Product', 'SN', 'Quantity', 'Cost', 'Total Cost']],
		body:
			rows.length > 0
				? rows.map((row) => [
						row.item_description,
						row.serial_number || '--',
						String(row.quantity),
						formatCurrencyPdf(row.cost),
						formatCurrencyPdf(row.total_cost)
					])
				: [[{ content: 'No items found for the selected Stock Transfer Request.', colSpan: 5, styles: { halign: 'center' } }]],
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
			1: { cellWidth: 70 },
			2: { halign: 'right', cellWidth: 50 },
			3: { halign: 'right', cellWidth: 70 },
			4: { halign: 'right', cellWidth: 80 }
		}
	});

	addReportFooter(doc);
	return doc;
}
