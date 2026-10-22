import autoTable, { type CellInput, type Styles } from 'jspdf-autotable';
import type { jsPDF } from 'jspdf';
import { addReportFooter, createReportDoc } from '$lib/utils/pdf';

// Standard jsPDF fonts have no ₱ glyph, so money renders as "Php" (same as inventory/print/pdf.ts)
function formatCurrencyPdf(value: string | number | null | undefined): string {
	const num = typeof value === 'string' ? parseFloat(value || '0') : (value ?? 0);
	return `Php ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function safeNum(value: unknown): number {
	const n = typeof value === 'string' ? parseFloat(value) : Number(value as number);
	return Number.isFinite(n) ? n : 0;
}

function formatDate(value: Date | string | number | null | undefined): string {
	if (value == null || value === '') return '';
	return new Date(value).toLocaleDateString('default', { day: 'numeric', month: 'long', year: 'numeric' });
}

// mirrors PrintReportLayout's .date-range label, including the "All Dates" fallback
function dateRangeLabel(filters?: { from?: string | null; to?: string | null }): string {
	const from = filters?.from || null;
	const to = filters?.to || null;
	if (from && to) return `${formatDate(from)} — ${formatDate(to)}`;
	if (from) return `From ${formatDate(from)}`;
	if (to) return `Up to ${formatDate(to)}`;
	return 'All Dates';
}

const EMPTY_TEXT = 'No data available.';

// structural twins of the getOpenSalesGroupedByCustomer result (declared locally — no $lib/server import)
export interface OpenSaleSummaryRow {
	sales_order_id: number | string;
	date_ordered: Date | string | null;
	notes?: string | null;
	total_cost: string | number | null;
}

export interface OpenSaleSummaryCustomer {
	customer: string;
	total: string | number;
	sales?: OpenSaleSummaryRow[];
}

export interface OpenSaleItem {
	item_name: string | null;
	item_quantity: string | number | null;
	item_cost: string | number | null;
	item_total_price: string | number | null;
}

export interface OpenSaleOrder {
	sales_order_id: number | string;
	date_ordered?: Date | string | null;
	total: string | number;
	items?: OpenSaleItem[];
}

export interface OpenSaleDetailCustomer {
	customer: string;
	total: string | number;
	sales?: OpenSaleOrder[];
}

export interface OpenSalesData {
	summary: OpenSaleSummaryCustomer[];
	detailed: OpenSaleDetailCustomer[];
}

// canonical view value — sent by the list page's TabsTrigger value="detailed"
export type OpenSalesView = 'summary' | 'detailed' | 'both';

function viewTitle(view: OpenSalesView): string {
	if (view === 'detailed') return 'Open Sales by Customer — Detail';
	if (view === 'both') return 'Open Sales by Customer';
	return 'Open Sales by Customer — Summary';
}

const BASE_STYLES: Partial<Styles> = {
	font: 'helvetica',
	fontSize: 9,
	cellPadding: 4,
	lineColor: 0,
	lineWidth: 0.5,
	overflow: 'linebreak',
	textColor: [17, 17, 17]
};

const HEAD_STYLES: Partial<Styles> = {
	fillColor: [240, 240, 240],
	textColor: [17, 17, 17],
	fontStyle: 'bold'
};

const BOLD: Partial<Styles> = { fontStyle: 'bold', textColor: [17, 17, 17] };
const MUTED_BOLD: Partial<Styles> = { fontStyle: 'bold', fontSize: 9, textColor: [102, 102, 102] };
const BOLD_RIGHT: Partial<Styles> = { halign: 'right', fontStyle: 'bold' };
const MUTED_BOLD_RIGHT: Partial<Styles> = { halign: 'right', fontStyle: 'bold', textColor: [102, 102, 102] };
const RIGHT: Partial<Styles> = { halign: 'right' };
const CENTER: Partial<Styles> = { halign: 'center' };

function tableFinalY(doc: jsPDF, fallback: number): number {
	return (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? fallback;
}

// mirrors the preview's grandTotal derived — reduces the summary's nested total_cost
function grandTotalOf(summary: OpenSaleSummaryCustomer[]): number {
	return summary
		.flatMap((c) => c.sales ?? [])
		.reduce((sum, sale) => sum + safeNum(sale.total_cost), 0);
}

function drawSummaryTable(doc: jsPDF, summary: OpenSaleSummaryCustomer[], margin: number, y: number): number {
	const grandTotal = grandTotalOf(summary);
	const rows: CellInput[][] = [];
	if (summary.length === 0) {
		rows.push([{ content: EMPTY_TEXT, colSpan: 5, styles: CENTER }]);
	} else {
		for (const sale of summary) {
			rows.push([{ content: sale.customer, colSpan: 5, styles: BOLD }]);
			for (const item of sale.sales ?? []) {
				rows.push([
					'Sales Order',
					formatDate(item.date_ordered),
					String(item.sales_order_id),
					item.notes ? item.notes : '-',
					{ content: formatCurrencyPdf(item.total_cost), styles: RIGHT }
				]);
			}
			rows.push([
				{ content: `${sale.customer} Total:`, colSpan: 4, styles: BOLD },
				{ content: formatCurrencyPdf(sale.total), styles: BOLD_RIGHT }
			]);
		}
	}

	autoTable(doc, {
		startY: y,
		margin: { left: margin, right: margin, top: 10, bottom: 48 },
		head: [['Customer', 'Date', 'SO Number', 'Notes', 'Amount']],
		body: rows,
		foot: [[{ content: 'Grand Total:', colSpan: 4, styles: BOLD }, { content: formatCurrencyPdf(grandTotal), styles: BOLD_RIGHT }]],
		theme: 'grid',
		styles: BASE_STYLES,
		headStyles: HEAD_STYLES,
		footStyles: HEAD_STYLES,
		columnStyles: {
			1: { cellWidth: 80 },
			2: { cellWidth: 70 },
			3: { cellWidth: 90 },
			4: { halign: 'right', cellWidth: 100 }
		}
	});
	return tableFinalY(doc, y) + 10;
}

function drawDetailTable(
	doc: jsPDF,
	detailed: OpenSaleDetailCustomer[],
	summary: OpenSaleSummaryCustomer[],
	margin: number,
	y: number
): number {
	// the preview's detail tfoot Grand Total is the SAME derived from summary — mirrored here
	const grandTotal = grandTotalOf(summary);
	const rows: CellInput[][] = [];
	for (const openSale of detailed) {
		rows.push([{ content: openSale.customer, colSpan: 4, styles: BOLD }]);
		for (const order of openSale.sales ?? []) {
			const dateLabel = formatDate(order.date_ordered);
			rows.push([
				{
					content: `Sales Order #${order.sales_order_id}${dateLabel ? `  —  ${dateLabel}` : ''}`,
					colSpan: 4,
					styles: MUTED_BOLD
				}
			]);
			for (const item of order.items ?? []) {
				rows.push([
					item.item_name ?? '',
					item.item_quantity == null ? '' : String(item.item_quantity),
					{ content: formatCurrencyPdf(item.item_cost), styles: RIGHT },
					{ content: formatCurrencyPdf(item.item_total_price), styles: RIGHT }
				]);
			}
			rows.push([
				{ content: `SO #${order.sales_order_id} Total:`, colSpan: 3, styles: MUTED_BOLD },
				{ content: formatCurrencyPdf(order.total), styles: MUTED_BOLD_RIGHT }
			]);
		}
		rows.push([
			{ content: `${openSale.customer} Total:`, colSpan: 3, styles: BOLD },
			{ content: formatCurrencyPdf(openSale.total), styles: BOLD_RIGHT }
		]);
	}

	autoTable(doc, {
		startY: y,
		margin: { left: margin, right: margin, top: 10, bottom: 48 },
		head: [['Item', 'Quantity', 'Cost', 'Total']],
		body: rows,
		foot: [[{ content: 'Grand Total:', colSpan: 3, styles: BOLD }, { content: formatCurrencyPdf(grandTotal), styles: BOLD_RIGHT }]],
		theme: 'grid',
		styles: BASE_STYLES,
		headStyles: HEAD_STYLES,
		footStyles: HEAD_STYLES,
		columnStyles: {
			1: { cellWidth: 60 },
			2: { halign: 'right', cellWidth: 90 },
			3: { halign: 'right', cellWidth: 100 }
		}
	});
	return tableFinalY(doc, y) + 10;
}

export function buildOpenSalesPdf(
	data: OpenSalesData,
	view: OpenSalesView,
	filters?: { from?: string | null; to?: string | null }
): jsPDF {
	const { doc, margin, startY } = createReportDoc({
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

	if (view === 'detailed' || view === 'both') {
		drawDetailTable(doc, data.detailed, data.summary, margin, y);
	}

	addReportFooter(doc);
	return doc;
}
