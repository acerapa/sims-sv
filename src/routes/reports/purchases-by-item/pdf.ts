import autoTable from 'jspdf-autotable';
import type { jsPDF } from 'jspdf';
import {
	addReportFooter,
	createReportDoc,
	dateRangeLabel,
	ensureSpace,
	formatCurrencyPdf,
	formatDatePdf,
	tableFinalY
} from '$lib/utils/pdf';

const EMPTY_RANGE_TEXT = 'No purchases found for the selected date range.';

// structural twin of ItemDetailRow in $lib/server/db/queries/reports — declared locally
// (no $lib/server import) so this module stays runnable from plain Node/Vitest
export interface PbiDetailRow {
	category_id: number;
	category_name: string;
	transaction_type: string;
	po_reference: string;
	receive_date: string;
	memo: string;
	supplier_name: string;
	product_sku: string;
	product_name: string;
	quantity: number;
	cost: string;
	total_cost: string;
}

export interface ItemDetailLine extends PbiDetailRow {
	running_balance: number;
}

export interface CategorySection {
	category_id: number;
	category_name: string;
	lines: ItemDetailLine[];
	subtotal: number;
}

export interface PbiSummaryRow {
	category_id: number;
	category_name: string;
	po_count: number;
	total_items: number;
	total_amount: string;
}

export interface PbiPrintData {
	summary: PbiSummaryRow[];
	detail: PbiDetailRow[];
}

export type PurchasesByItemView = 'summary' | 'detail' | 'both';

function viewTitle(view: PurchasesByItemView): string {
	if (view === 'detail') return 'Purchases by Item — Detail';
	if (view === 'both') return 'Purchases by Item';
	return 'Purchases by Item — Summary';
}

/**
 * Groups flat detail rows into categories, preserving order of first
 * appearance, and assigns each line a running balance in report order.
 * Shared by the preview and the PDF so both group identically by construction.
 */
export function groupDetailByCategory(rows: PbiDetailRow[]): CategorySection[] {
	const sections: CategorySection[] = [];
	let runningBalance = 0;

	for (const row of rows) {
		runningBalance += parseFloat(row.total_cost || '0');

		let section = sections.find((s) => s.category_id === row.category_id);
		if (!section) {
			section = {
				category_id: row.category_id,
				category_name: row.category_name,
				lines: [],
				subtotal: 0
			};
			sections.push(section);
		}

		section.lines.push({ ...row, running_balance: runningBalance });
	}

	for (const section of sections) {
		section.subtotal = section.lines.reduce(
			(sum, line) => sum + parseFloat(line.total_cost || '0'),
			0
		);
	}

	return sections;
}

function drawSummaryTable(
	doc: jsPDF,
	summary: PbiSummaryRow[],
	margin: number,
	y: number
): number {
	// same reduces as the preview's grandTotals derived (total_amount arrives as a string)
	const grand = {
		po_count: summary.reduce((sum, row) => sum + row.po_count, 0),
		total_items: summary.reduce((sum, row) => sum + row.total_items, 0),
		total_amount: summary.reduce((sum, row) => sum + parseFloat(row.total_amount || '0'), 0)
	};

	autoTable(doc, {
		startY: y,
		margin: { left: margin, right: margin, top: 10, bottom: 48 },
		head: [['Category Name', '# of POs', 'Total Items Purchased', 'Total Amount']],
		body:
			summary.length > 0
				? summary.map((row) => [
						row.category_name,
						String(row.po_count),
						String(row.total_items),
						formatCurrencyPdf(row.total_amount)
					])
				: [[{ content: EMPTY_RANGE_TEXT, colSpan: 4, styles: { halign: 'center' } }]],
		foot:
			summary.length > 0
				? [
						[
							'Grand Total',
							String(grand.po_count),
							String(grand.total_items),
							formatCurrencyPdf(grand.total_amount)
						]
					]
				: [],
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
		footStyles: { fillColor: [240, 240, 240], textColor: [17, 17, 17], fontStyle: 'bold' },
		columnStyles: {
			1: { halign: 'right', cellWidth: 70 },
			2: { halign: 'right', cellWidth: 110 },
			3: { halign: 'right', cellWidth: 110 }
		}
	});
	return tableFinalY(doc, y) + 10;
}

function drawLinesTable(doc: jsPDF, section: CategorySection, margin: number, y: number): number {
	autoTable(doc, {
		startY: y,
		margin: { left: margin, right: margin, top: 10, bottom: 48 },
		head: [
			['Type', 'Date', 'Ref No.', 'Memo', 'Vendor', 'Item', 'Qty', 'Cost Price', 'Amount', 'Balance']
		],
		body: section.lines.map((line) => [
			line.transaction_type,
			formatDatePdf(line.receive_date),
			line.po_reference,
			line.memo,
			line.supplier_name,
			line.product_name,
			String(line.quantity),
			formatCurrencyPdf(line.cost),
			formatCurrencyPdf(line.total_cost),
			formatCurrencyPdf(line.running_balance)
		]),
		theme: 'grid',
		styles: {
			font: 'helvetica',
			fontSize: 8,
			cellPadding: 3,
			lineColor: 0,
			lineWidth: 0.5,
			overflow: 'linebreak',
			textColor: [17, 17, 17]
		},
		headStyles: { fillColor: [240, 240, 240], textColor: [17, 17, 17], fontStyle: 'bold' },
		columnStyles: {
			6: { halign: 'right', cellWidth: 30 },
			7: { halign: 'right', cellWidth: 65 },
			8: { halign: 'right', cellWidth: 75 },
			9: { halign: 'right', cellWidth: 75 }
		}
	});
	return tableFinalY(doc, y) + 8;
}

function drawCategories(
	doc: jsPDF,
	sections: CategorySection[],
	margin: number,
	pageWidth: number,
	pageHeight: number,
	y: number
): number {
	let cursor = y;
	for (const section of sections) {
		// section heading — the preview's <h3 class="print-section-title">
		cursor = ensureSpace(doc, cursor, 60, pageHeight);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(12);
		doc.text(section.category_name, margin, cursor + 14);
		cursor += 24;

		cursor = drawLinesTable(doc, section, margin, cursor);

		// right-aligned bold "Subtotal: Php …" — the preview's .print-vendor-subtotal
		cursor = ensureSpace(doc, cursor, 20, pageHeight);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(10);
		doc.text(`Subtotal: ${formatCurrencyPdf(section.subtotal)}`, pageWidth - margin, cursor + 12, {
			align: 'right'
		});
		cursor += 24;
	}
	return cursor;
}

export async function buildPurchasesByItemPdf(
	data: PbiPrintData,
	view: PurchasesByItemView,
	filters?: { from?: string | null; to?: string | null }
): Promise<jsPDF> {
	const { doc, margin, pageWidth, pageHeight, startY } = await createReportDoc({
		title: viewTitle(view),
		subtitle: dateRangeLabel(filters),
		// detail's ten columns don't fit a portrait page — summary stays portrait
		orientation: view === 'detail' || view === 'both' ? 'landscape' : 'portrait'
	});

	let y = startY;
	if (view === 'summary' || view === 'both') {
		y = drawSummaryTable(doc, data.summary, margin, y);
	}

	if (view === 'both') {
		// the preview's forced .page-break + "Detail" heading
		doc.addPage();
		y = 48;
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(13);
		doc.text('Detail', margin, y + 14);
		y += 26;
	}

	if (view === 'detail' || view === 'both') {
		const sections = groupDetailByCategory(data.detail);
		if (sections.length === 0) {
			doc.setFont('helvetica', 'normal');
			doc.setFontSize(10);
			doc.setTextColor(102, 102, 102);
			doc.text(EMPTY_RANGE_TEXT, pageWidth / 2, ensureSpace(doc, y, 40, pageHeight) + 20, {
				align: 'center'
			});
			doc.setTextColor(0, 0, 0);
		} else {
			drawCategories(doc, sections, margin, pageWidth, pageHeight, y);
		}
	}

	addReportFooter(doc);
	return doc;
}
