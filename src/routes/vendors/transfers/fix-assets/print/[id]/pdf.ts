import autoTable from 'jspdf-autotable';
import type { jsPDF } from 'jspdf';
import { addReportFooter, createReportDoc } from '$lib/utils/pdf';

// Standard jsPDF fonts have no ₱ glyph, so money renders as "Php" (same as inventory/print/pdf.ts)
function formatCurrencyPdf(value: string | number): string {
	const num = typeof value === 'string' ? parseFloat(value || '0') : value;
	return `Php ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDatePdf(date: Date): string {
	return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function capitalize(value: string): string {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

// #666 — matches the preview's muted-foreground labels
const LABEL_COLOR: [number, number, number] = [102, 102, 102];

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

/** Draws a `LABEL` over a value with a muted underline (mirrors the preview's bordered fields). */
function drawField(
	doc: jsPDF,
	x: number,
	width: number,
	label: string,
	value: string,
	y: number
): number {
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

function ensureSpace(doc: jsPDF, y: number, needed: number, pageHeight: number): number {
	// 48pt bottom band stays free for the report footer
	if (y + needed > pageHeight - 48) {
		doc.addPage();
		return 48;
	}
	return y;
}

function drawNotesLine(
	doc: jsPDF,
	line: string,
	margin: number,
	y: number,
	pageHeight: number
): number {
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
		// uncapped free text — paginate explicitly rather than relying on jsPDF's auto-paging
		y = drawNotesLine(doc, line, margin, y, pageHeight);
	}
	return y + 8;
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
	y = drawField(doc, margin, colWidth, 'USER', fixAsset.user ? capitalize(fixAsset.user) : '', y);

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
