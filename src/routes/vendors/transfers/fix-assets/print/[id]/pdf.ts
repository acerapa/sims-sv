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
	formatDatePdf
} from '$lib/utils/pdf';

export interface FixAssetItemSource {
	item_description: string;
	serial_numbers: string[];
	serial_number?: string;
	quantity: string | number;
	cost: string | number;
	total_cost: string | number;
}

export interface FixAssetItemRow {
	item_description: string;
	serial_number?: string;
	quantity: string | number;
	cost: string | number;
	total_cost: string | number;
}

export interface FixAssetPrintData {
	id: number;
	date_transfered: Date;
	user: string;
	notes: string | null;
	items: FixAssetItemSource[];
}

/**
 * Serial-tracked items arrive as one product line holding N serials; the
 * report prints one line per serial at quantity 1 (mirrors the preview).
 */
export function expandFixAssetItems(items: FixAssetItemSource[]): FixAssetItemRow[] {
	const rows: FixAssetItemRow[] = [];
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

export function buildFixAssetPdf(fixAsset: FixAssetPrintData): jsPDF {
	const { doc, margin, pageWidth, pageHeight, startY } = createReportDoc({
		title: 'Fixed Asset Transfer'
	});
	const colWidth = (pageWidth - margin * 2) / 2;

	let y = drawField(doc, margin, colWidth, 'FIX REFERENCE NO.', `FIX-${fixAsset.id}`, startY);
	drawField(
		doc,
		margin + colWidth,
		colWidth,
		'TRANSFER DATE',
		formatDatePdf(fixAsset.date_transfered),
		startY
	);
	y = drawField(
		doc,
		margin + colWidth,
		colWidth,
		'USER',
		fixAsset.user ? capitalizeFirst(fixAsset.user) : '',
		y
	);

	y = ensureSpace(doc, y + 40, 40, pageHeight);
	y = drawNotes(doc, fixAsset.notes ?? '', margin, y, pageWidth, pageHeight);

	// "Items Transferred" heading + rule (mirrors the <p> + <hr> pair in the preview)
	y = ensureSpace(doc, y, 60, pageHeight);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(11);
	doc.text('Items Transferred', margin, y + 14);
	y += 24;
	doc.setLineWidth(1);
	doc.line(margin, y, pageWidth - margin, y);
	y += 6;

	const rows = expandFixAssetItems(fixAsset.items);
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
				: [
						[
							{
								content: 'No items found for this Fix Asset.',
								colSpan: 5,
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
			1: { cellWidth: 70 },
			2: { halign: 'right', cellWidth: 50 },
			3: { halign: 'right', cellWidth: 70 },
			4: { halign: 'right', cellWidth: 80 }
		}
	});

	addReportFooter(doc);
	return doc;
}
