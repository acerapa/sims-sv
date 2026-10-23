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
	tableFinalY,
	titleCase
} from '$lib/utils/pdf';

const EMPTY_RANGE_TEXT = 'No sales orders found for the selected date range.';

export interface SbcSummaryRow {
	customer_name: string;
	total_orders: string | number;
	total_items: string | number;
	total_sales: string | number;
}

export interface SbcOrder {
	// arrives as a groupBy key string from the server query, even though it is an id
	sales_order_id: string | number;
	date_ordered: Date | string;
	order_status: string;
	items: {
		product_name: string | null;
		// salesOrderItems.quantity is nullable in the schema — preview renders blank for it
		item_quantity: string | number | null;
		item_price: string | number;
		item_total: string | number;
	}[];
}

export interface SbcCustomer {
	customer_name: string;
	orders: SbcOrder[];
	subtotal: string | number;
}

export interface SalesByCustomerData {
	summary: SbcSummaryRow[];
	detailed: SbcCustomer[];
}

export type SalesByCustomerView = 'summary' | 'detail' | 'both';

function viewTitle(view: SalesByCustomerView): string {
	if (view === 'detail') return 'Sales by Customer — Detail';
	if (view === 'both') return 'Sales by Customer';
	return 'Sales by Customer — Summary';
}

function drawSummaryTable(doc: jsPDF, summary: SbcSummaryRow[], margin: number, y: number): number {
	autoTable(doc, {
		startY: y,
		margin: { left: margin, right: margin, top: 10, bottom: 48 },
		head: [['Customer Name', '# of Orders', 'Total Items Sold', 'Total Amount']],
		body:
			summary.length > 0
				? summary.map((row) => [
						row.customer_name,
						String(row.total_orders),
						String(row.total_items),
						formatCurrencyPdf(row.total_sales)
					])
				: [[{ content: EMPTY_RANGE_TEXT, colSpan: 4, styles: { halign: 'center' } }]],
		foot:
			summary.length > 0
				? [
						[
							'Grand Total',
							String(summary.reduce((acc, row) => safeNum(acc) + safeNum(row.total_orders), 0)),
							String(summary.reduce((acc, row) => safeNum(acc) + safeNum(row.total_items), 0)),
							formatCurrencyPdf(summary.reduce((acc, row) => safeNum(acc) + safeNum(row.total_sales), 0))
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
			2: { halign: 'right', cellWidth: 90 },
			3: { halign: 'right', cellWidth: 110 }
		}
	});
	const finalY = tableFinalY(doc, y);
	return finalY + 10;
}

function drawOrderItemsTable(doc: jsPDF, order: SbcOrder, margin: number, y: number): number {
	autoTable(doc, {
		startY: y,
		margin: { left: margin, right: margin, top: 10, bottom: 48 },
		head: [['Product', 'Qty', 'Unit Price', 'Total Price']],
		body: order.items.map((item) => [
			item.product_name || '',
			item.item_quantity == null ? '' : String(item.item_quantity),
			formatCurrencyPdf(item.item_price),
			formatCurrencyPdf(item.item_total)
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
	const finalY = tableFinalY(doc, y);
	return finalY + 8;
}

function drawDetailSections(
	doc: jsPDF,
	detailed: SbcCustomer[],
	view: SalesByCustomerView,
	margin: number,
	pageWidth: number,
	pageHeight: number,
	y: number
): number {
	if (detailed.length === 0) {
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(10);
		doc.setTextColor(102, 102, 102);
		doc.text(EMPTY_RANGE_TEXT, pageWidth / 2, ensureSpace(doc, y, 40, pageHeight) + 20, { align: 'center' });
		doc.setTextColor(0, 0, 0);
		return y + 40;
	}

	let cursor = y;
	detailed.forEach((customer, cIdx) => {
		// the preview forces a page break before each customer except the first, but
		// only in 'detail' view (per spec decision 2 — 'both' flows continuously)
		if (cIdx > 0 && view === 'detail') {
			doc.addPage();
			cursor = 48;
		}
		cursor = ensureSpace(doc, cursor, 60, pageHeight);

		// section heading — the preview's <h3 class="print-section-title">
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(12);
		doc.text(customer.customer_name, margin, cursor + 14);
		cursor += 24;

		for (const order of customer.orders) {
			// SO header line — the preview's .print-po-header (ref · date · capitalized status)
			cursor = ensureSpace(doc, cursor, 30, pageHeight);
			doc.setFont('helvetica', 'bold');
			doc.setFontSize(9);
			doc.text(`SO-${order.sales_order_id}`, margin, cursor + 8);
			doc.setFont('helvetica', 'normal');
			const status = order.order_status ? titleCase(order.order_status) : '';
			doc.text(
				`${formatDatePdf(order.date_ordered)}  –  ${status}`,
				margin,
				cursor + 18
			);
			cursor += 28;

			cursor = drawOrderItemsTable(doc, order, margin, cursor);
		}

		// right-aligned bold "Subtotal: Php …" — the preview's .print-vendor-subtotal
		cursor = ensureSpace(doc, cursor, 20, pageHeight);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(10);
		doc.text(`Subtotal: ${formatCurrencyPdf(customer.subtotal)}`, pageWidth - margin, cursor + 12, {
			align: 'right'
		});
		cursor += 24;
	});
	return cursor;
}

export function buildSalesByCustomerPdf(
	data: SalesByCustomerData,
	view: SalesByCustomerView,
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
		drawDetailSections(doc, data.detailed, view, margin, pageWidth, pageHeight, y);
	}

	addReportFooter(doc);
	return doc;
}
