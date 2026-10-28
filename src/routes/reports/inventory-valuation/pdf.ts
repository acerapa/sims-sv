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

const EMPTY_TEXT = 'No stock movements found for the selected date range.';
const EXCLUSION_NOTE =
	'RMAs and physical inventory counts do not affect stock in this system and are not included.';

// Structural twins of ValuationDetailRow / ValuationSummaryRow in
// $lib/server/db/queries/reports/inventory-valuation — declared locally (no
// $lib/server import) so this module stays runnable from plain Node/Vitest.
export interface IvDetailRow {
	product_id: number;
	product_sku: string;
	product_name: string;
	category_name: string;
	transaction_type: string;
	txn_date: string;
	ref_no: string;
	counterparty: string;
	quantity: number;
	unit_cost: string;
	on_hand_after: number;
	asset_value_after: string;
	current_stock: number;
	is_opening: boolean;
}

export interface IvSummaryRow {
	product_id: number;
	product_sku: string;
	product_name: string;
	category_name: string;
	opening: number;
	qty_in: number;
	qty_out: number;
	movement_count: number;
	ending: number;
	ending_value: string;
}

export interface IvPrintData {
	summary: IvSummaryRow[];
	detail: IvDetailRow[];
}

export type InventoryValuationView = 'summary' | 'detail';

export interface ProductSection {
	product_id: number;
	product_sku: string;
	product_name: string;
	category_name: string;
	lines: IvDetailRow[];
	/** Reconstructed ending balance disagrees with the live system stock count. */
	stock_mismatch: boolean;
	system_stock: number;
}

/**
 * Groups detail rows into per-product sections (rows arrive ordered by SKU),
 * and flags sections whose reconstructed balance disagrees with the live
 * product count — shared by preview and PDF so both mark it the same way.
 */
export function groupByProduct(rows: IvDetailRow[]): ProductSection[] {
	const sections: ProductSection[] = [];

	for (const row of rows) {
		let section = sections.find((s) => s.product_id === row.product_id);
		if (!section) {
			section = {
				product_id: row.product_id,
				product_sku: row.product_sku,
				product_name: row.product_name,
				category_name: row.category_name,
				lines: [],
				stock_mismatch: false,
				system_stock: row.current_stock
			};
			sections.push(section);
		}
		section.lines.push(row);
	}

	for (const section of sections) {
		const last = section.lines[section.lines.length - 1];
		section.system_stock = last ? last.current_stock : 0;
		section.stock_mismatch = last ? last.on_hand_after !== last.current_stock : false;
	}

	return sections;
}

const signedQty = (qty: number): string => (qty > 0 ? `+${qty}` : String(qty));

function viewTitle(view: InventoryValuationView): string {
	return view === 'summary' ? 'Inventory Valuation Summary' : 'Inventory Valuation Detail';
}

function drawSummaryTable(doc: jsPDF, summary: IvSummaryRow[], margin: number, y: number): number {
	const totals = {
		opening: summary.reduce((sum, row) => sum + row.opening, 0),
		qty_in: summary.reduce((sum, row) => sum + row.qty_in, 0),
		qty_out: summary.reduce((sum, row) => sum + row.qty_out, 0),
		ending: summary.reduce((sum, row) => sum + row.ending, 0),
		ending_value: summary.reduce((sum, row) => sum + parseFloat(row.ending_value || '0'), 0)
	};

	autoTable(doc, {
		startY: y,
		margin: { left: margin, right: margin, top: 10, bottom: 48 },
		head: [['Item', 'SKU', 'Opening', '+ In', '- Out', 'Ending Stock', 'Ending Value']],
		body:
			summary.length > 0
				? summary.map((row) => [
						row.product_name,
						row.product_sku,
						String(row.opening),
						String(row.qty_in),
						String(row.qty_out),
						String(row.ending),
						formatCurrencyPdf(row.ending_value)
					])
				: [[{ content: EMPTY_TEXT, colSpan: 7, styles: { halign: 'center' } }]],
		foot:
			summary.length > 0
				? [
						[
							'Grand Total',
							'',
							String(totals.opening),
							String(totals.qty_in),
							String(totals.qty_out),
							String(totals.ending),
							formatCurrencyPdf(totals.ending_value)
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
			0: { cellWidth: 150 },
			2: { halign: 'right', cellWidth: 50 },
			3: { halign: 'right', cellWidth: 50 },
			4: { halign: 'right', cellWidth: 50 },
			5: { halign: 'right', cellWidth: 70 },
			6: { halign: 'right', cellWidth: 90 }
		}
	});
	return tableFinalY(doc, y) + 10;
}

function drawDetailTable(doc: jsPDF, section: ProductSection, margin: number, y: number): number {
	autoTable(doc, {
		startY: y,
		margin: { left: margin, right: margin, top: 10, bottom: 48 },
		head: [
			['Date', 'Type', 'Ref No.', 'Counterparty', 'Qty', 'Unit Cost', 'On Hand', 'Asset Value']
		],
		body: section.lines.map((line) => [
			formatDatePdf(line.txn_date),
			line.transaction_type,
			line.ref_no || '—',
			line.counterparty || '—',
			signedQty(line.quantity),
			formatCurrencyPdf(line.unit_cost),
			String(line.on_hand_after),
			formatCurrencyPdf(line.asset_value_after)
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
			0: { cellWidth: 80 },
			4: { halign: 'right', cellWidth: 40 },
			5: { halign: 'right', cellWidth: 80 },
			6: { halign: 'right', cellWidth: 50 },
			7: { halign: 'right', cellWidth: 90 }
		}
	});
	return tableFinalY(doc, y);
}

function drawItemSections(
	doc: jsPDF,
	sections: ProductSection[],
	margin: number,
	pageWidth: number,
	pageHeight: number,
	y: number
): number {
	let cursor = y;
	for (const section of sections) {
		cursor = ensureSpace(doc, cursor, 80, pageHeight);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(12);
		const heading = section.category_name
			? `${section.product_sku} — ${section.product_name} (${section.category_name})`
			: `${section.product_sku} — ${section.product_name}`;
		doc.text(heading, margin, cursor + 14);
		cursor += 26;

		cursor = drawDetailTable(doc, section, margin, cursor) + 6;

		if (section.stock_mismatch) {
			cursor = ensureSpace(doc, cursor, 20, pageHeight);
			doc.setFont('helvetica', 'italic');
			doc.setFontSize(8);
			doc.setTextColor(102, 102, 102);
			doc.text(
				`Note: reconstructed ending balance does not match the current system stock (${section.system_stock}) — likely a manual stock edit.`,
				margin,
				cursor + 10
			);
			doc.setTextColor(0, 0, 0);
			cursor += 20;
		}
		cursor += 8;
	}
	return cursor;
}

export async function buildInventoryValuationPdf(
	data: IvPrintData,
	view: InventoryValuationView,
	filters?: { from?: string | null; to?: string | null }
): Promise<jsPDF> {
	const { doc, margin, pageWidth, startY } = await createReportDoc({
		title: viewTitle(view),
		subtitle: dateRangeLabel(filters),
		orientation: view === 'summary' ? 'portrait' : 'landscape'
	});

	const pageHeight = doc.internal.pageSize.getHeight();
	let y = startY;

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8);
	doc.setTextColor(102, 102, 102);
	doc.text(EXCLUSION_NOTE, margin, y, { maxWidth: pageWidth - margin * 2 });
	doc.setTextColor(0, 0, 0);
	y += 24;

	if (view === 'summary') {
		drawSummaryTable(doc, data.summary, margin, y);
	} else {
		const sections = groupByProduct(data.detail);
		if (sections.length === 0) {
			doc.setFontSize(10);
			doc.setTextColor(102, 102, 102);
			doc.text(EMPTY_TEXT, pageWidth / 2, ensureSpace(doc, y, 40, pageHeight) + 20, {
				align: 'center'
			});
			doc.setTextColor(0, 0, 0);
		} else {
			drawItemSections(doc, sections, margin, pageWidth, pageHeight, y);
		}
	}

	addReportFooter(doc);
	return doc;
}
