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

const EMPTY_RANGE_TEXT = 'No purchase orders found for the selected date range.';

// structural twin of VendorDetailRow in $lib/server/db/queries/reports — declared locally
// (no $lib/server import) so this module stays runnable from plain Node/Vitest
export interface PbvDetailRow {
	supplier_id: number | null;
	supplier_name: string;
	po_id: number;
	po_reference: string;
	receive_date: string;
	po_total: string;
	product_sku: string;
	product_name: string;
	quantity: number;
	cost: string;
	total_cost: string;
}

export interface PbvPo {
	po_id: number;
	po_reference: string;
	receive_date: string;
	po_total: string;
	items: {
		product_name: string;
		product_sku: string;
		quantity: number;
		cost: string;
		total_cost: string;
	}[];
}

export interface GroupedVendor {
	supplier_id: number | null;
	supplier_name: string;
	pos: PbvPo[];
	subtotal: number;
}

/**
 * Groups flat vendor detail rows into vendor → PO → item, preserving order of first
 * appearance and summing each vendor's subtotal from its PO totals.
 * Shared by the preview and the PDF so both group identically by construction.
 */
export function groupDetailByVendor(rows: PbvDetailRow[]): GroupedVendor[] {
	const vendors: GroupedVendor[] = [];

	for (const row of rows) {
		let vendor = vendors.find((v) => v.supplier_id === row.supplier_id);
		if (!vendor) {
			vendor = {
				supplier_id: row.supplier_id,
				supplier_name: row.supplier_name,
				pos: [],
				subtotal: 0
			};
			vendors.push(vendor);
		}

		let po = vendor.pos.find((p) => p.po_id === row.po_id);
		if (!po) {
			po = {
				po_id: row.po_id,
				po_reference: row.po_reference,
				receive_date: row.receive_date,
				po_total: row.po_total,
				items: []
			};
			vendor.pos.push(po);
		}

		po.items.push({
			product_name: row.product_name,
			product_sku: row.product_sku,
			quantity: row.quantity,
			cost: row.cost,
			total_cost: row.total_cost
		});
	}

	for (const vendor of vendors) {
		vendor.subtotal = vendor.pos.reduce(
			(sum, po) => sum + parseFloat(po.po_total || '0'),
			0
		);
	}

	return vendors;
}

export interface PbvSummaryRow {
	supplier_id: number | null;
	supplier_name: string;
	po_count: number;
	total_items: number;
	total_amount: string;
}

export interface PbvPrintData {
	summary: PbvSummaryRow[];
	detail: PbvDetailRow[];
}

export type PurchasesByVendorView = 'summary' | 'detail' | 'both';

function viewTitle(view: PurchasesByVendorView): string {
	if (view === 'detail') return 'Purchases by Vendor — Detail';
	if (view === 'both') return 'Purchases by Vendor';
	return 'Purchases by Vendor — Summary';
}

function drawSummaryTable(
	doc: jsPDF,
	summary: PbvSummaryRow[],
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
		head: [['Vendor Name', '# of POs', 'Total Items Received', 'Total Amount']],
		body:
			summary.length > 0
				? summary.map((row) => [
						row.supplier_name,
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

function drawPoItemsTable(doc: jsPDF, po: PbvPo, margin: number, y: number): number {
	autoTable(doc, {
		startY: y,
		margin: { left: margin, right: margin, top: 10, bottom: 48 },
		head: [['Product', 'Qty', 'Unit Cost', 'Total Cost']],
		body: po.items.map((item) => [
			item.product_name,
			String(item.quantity),
			formatCurrencyPdf(item.cost),
			formatCurrencyPdf(item.total_cost)
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
			3: { halign: 'right', cellWidth: 100 }
		}
	});
	return tableFinalY(doc, y) + 8;
}

function drawDetailSections(
	doc: jsPDF,
	vendors: GroupedVendor[],
	view: PurchasesByVendorView,
	margin: number,
	pageWidth: number,
	pageHeight: number,
	y: number
): number {
	if (vendors.length === 0) {
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(10);
		doc.setTextColor(102, 102, 102);
		doc.text(EMPTY_RANGE_TEXT, pageWidth / 2, ensureSpace(doc, y, 40, pageHeight) + 20, {
			align: 'center'
		});
		doc.setTextColor(0, 0, 0);
		return y + 40;
	}

	let cursor = y;
	vendors.forEach((vendor, vIdx) => {
		// the preview forces a page break before each vendor except the first, but
		// only in 'detail' view — 'both' flows continuously
		if (vIdx > 0 && view === 'detail') {
			doc.addPage();
			cursor = 48;
		}
		cursor = ensureSpace(doc, cursor, 60, pageHeight);

		// section heading — the preview's <h3 class="print-section-title">
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(12);
		doc.text(vendor.supplier_name, margin, cursor + 14);
		cursor += 24;

		for (const po of vendor.pos) {
			// PO header line — the preview's .print-po-header (reference · receive date)
			cursor = ensureSpace(doc, cursor, 30, pageHeight);
			doc.setFont('helvetica', 'bold');
			doc.setFontSize(9);
			doc.text(po.po_reference, margin, cursor + 8);
			doc.setFont('helvetica', 'normal');
			doc.text(`${formatDatePdf(po.receive_date)}`, margin, cursor + 18);
			cursor += 28;

			cursor = drawPoItemsTable(doc, po, margin, cursor);
		}

		// right-aligned bold "Subtotal: Php …" — the preview's .print-vendor-subtotal
		cursor = ensureSpace(doc, cursor, 20, pageHeight);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(10);
		doc.text(`Subtotal: ${formatCurrencyPdf(vendor.subtotal)}`, pageWidth - margin, cursor + 12, {
			align: 'right'
		});
		cursor += 24;
	});
	return cursor;
}

export function buildPurchasesByVendorPdf(
	data: PbvPrintData,
	view: PurchasesByVendorView,
	filters?: { from?: string | null; to?: string | null }
): jsPDF {
	const { doc, margin, pageWidth, pageHeight, startY } = createReportDoc({
		title: viewTitle(view),
		subtitle: dateRangeLabel(filters)
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
		drawDetailSections(doc, groupDetailByVendor(data.detail), view, margin, pageWidth, pageHeight, y);
	}

	addReportFooter(doc);
	return doc;
}
