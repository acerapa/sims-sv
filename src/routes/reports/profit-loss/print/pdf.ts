import autoTable, { type CellInput, type Styles } from 'jspdf-autotable';
import type { jsPDF } from 'jspdf';
import {
	addReportFooter,
	createReportDoc,
	dateRangeLabel,
	formatCurrencyPdf,
	safeNum,
	tableFinalY
} from '$lib/utils/pdf';

// Single source of truth for the preview (+page.svelte) and the PDF:
// both import these, so rounding/wording can never drift apart.

/** Preview money — keeps the ₱ glyph (browser fonts have it) */
export function formatCurrency(value: string | number): string {
	const formatted = safeNum(value).toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
	return `₱${formatted}`;
}

export function formatMonth(monthStr: string): string {
	const [year, month] = monthStr.split('-');
	const date = new Date(parseInt(year), parseInt(month) - 1);
	return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
}

export function grossMarginPercent(income: number, grossProfit: number): string {
	if (income === 0) return '0.0';
	return ((grossProfit / income) * 100).toFixed(1);
}

// ── Data contracts ────────────────────────────────────────────────
// Structural twins of the getProfitLoss* result rows (declared locally — no $lib/server import)

export interface ProfitLossSummary {
	total_income: string | number | null;
	total_cogs: string | number | null;
	gross_profit: string | number | null;
}

export interface ProfitLossMonthly {
	month: string;
	income: string | number | null;
	cogs: string | number | null;
	gross_profit: string | number | null;
}

export interface ProfitLossDetailRow {
	product_id: number;
	product_sku: string;
	product_name: string;
	quantity_sold: number;
	total_revenue: string | number | null;
	total_cost: string | number | null;
	profit: string | number | null;
}

export interface ProfitLossData {
	summary: ProfitLossSummary;
	monthly: ProfitLossMonthly[];
	detail: ProfitLossDetailRow[];
}

export type ProfitLossView = 'summary' | 'detail' | 'both';

function viewTitle(view: ProfitLossView): string {
	if (view === 'detail') return 'Profit & Loss — By Product';
	if (view === 'both') return 'Profit & Loss';
	return 'Profit & Loss — Summary';
}

const EMPTY_TEXT = 'No invoice data found for the selected date range.';

// more monthly columns than this would squeeze portrait width past readable
// (user decision 2026-07: wide ranges print landscape)
const PORTRAIT_MONTH_LIMIT = 8;

// ── Table styles ──────────────────────────────────────────────────

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
const RIGHT: Partial<Styles> = { halign: 'right' };
const BOLD_RIGHT: Partial<Styles> = { halign: 'right', fontStyle: 'bold' };
// mirrors the preview's tfoot Gross Margin row (#666 @ 0.75rem)
const MUTED: Partial<Styles> = { fontSize: 8, textColor: [102, 102, 102] };
const MUTED_RIGHT: Partial<Styles> = { halign: 'right', fontSize: 8, textColor: [102, 102, 102] };
const CENTER: Partial<Styles> = { halign: 'center', textColor: [102, 102, 102] };

// ── Sections ──────────────────────────────────────────────────────

function pageWidthOf(doc: jsPDF): number {
	return doc.internal.pageSize.getWidth();
}

// mirrors the preview's 4-up Overall Totals strip (label bold, value after)
function drawOverallTotals(
	doc: jsPDF,
	summary: ProfitLossSummary,
	margin: number,
	y: number
): number {
	const income = safeNum(summary.total_income);
	const cogs = safeNum(summary.total_cogs);
	const grossProfit = safeNum(summary.gross_profit);
	const pairWidth = (pageWidthOf(doc) - 2 * margin) / 2;

	autoTable(doc, {
		startY: y,
		margin: { left: margin, right: margin, top: 4, bottom: 48 },
		body: [
			[
				{ content: 'Total Income:', styles: BOLD },
				{ content: formatCurrencyPdf(income), styles: RIGHT },
				{ content: 'COGS:', styles: BOLD },
				{ content: formatCurrencyPdf(cogs), styles: RIGHT }
			],
			[
				{ content: 'Gross Profit:', styles: BOLD },
				{ content: formatCurrencyPdf(grossProfit), styles: RIGHT },
				{ content: 'Gross Margin:', styles: BOLD },
				{ content: `${grossMarginPercent(income, grossProfit)}%`, styles: RIGHT }
			]
		],
		theme: 'plain',
		styles: BASE_STYLES,
		columnStyles: {
			0: { cellWidth: pairWidth },
			2: { cellWidth: pairWidth }
		}
	});
	return tableFinalY(doc, y) + 14;
}

// transposed monthly breakdown: rows = Income / COGS / (foot) Gross Profit / Gross Margin %
function drawMonthlyTable(
	doc: jsPDF,
	monthly: ProfitLossMonthly[],
	margin: number,
	y: number
): number {
	const showTotalCol = monthly.length > 1;
	const labelWidth = 110;
	const valueColCount = monthly.length + (showTotalCol ? 1 : 0);
	const valueWidth = (pageWidthOf(doc) - 2 * margin - labelWidth) / Math.max(valueColCount, 1);

	// no monthly rows: let the single (empty-state) column take the full width,
	// so the message renders on one line like the preview
	const columnStyles: Record<number, Partial<Styles>> = {};
	if (monthly.length > 0) {
		columnStyles[0] = { cellWidth: labelWidth };
		for (let i = 1; i <= valueColCount; i++) {
			columnStyles[i] = { cellWidth: valueWidth, halign: 'right' };
		}
	}

	const totals = monthly.reduce(
		(acc, row) => {
			acc.income += safeNum(row.income);
			acc.cogs += safeNum(row.cogs);
			acc.grossProfit += safeNum(row.gross_profit);
			return acc;
		},
		{ income: 0, cogs: 0, grossProfit: 0 }
	);

	const valueRow = (
		label: string,
		pick: (row: ProfitLossMonthly) => string | number | null,
		total: number
	): CellInput[] => [
		{ content: label, styles: BOLD },
		...monthly.map((row) => ({ content: formatCurrencyPdf(pick(row)), styles: RIGHT })),
		...(showTotalCol ? [{ content: formatCurrencyPdf(total), styles: BOLD_RIGHT }] : [])
	];

	const head: CellInput[] = [''];
	for (const row of monthly) {
		head.push({ content: formatMonth(row.month), styles: RIGHT });
	}
	if (showTotalCol) {
		head.push({ content: 'Total', styles: RIGHT });
	}

	const marginRow = [
		{ content: 'Gross Margin %', styles: MUTED },
		...monthly.map((row) => ({
			content: `${grossMarginPercent(safeNum(row.income), safeNum(row.gross_profit))}%`,
			styles: MUTED_RIGHT
		})),
		...(showTotalCol
			? [
					{
						content: `${grossMarginPercent(totals.income, totals.grossProfit)}%`,
						styles: MUTED_RIGHT
					}
				]
			: [])
	];

	autoTable(doc, {
		startY: y,
		margin: { left: margin, right: margin, top: 8, bottom: 48 },
		head: [head],
		body:
			monthly.length === 0
				? [[{ content: EMPTY_TEXT, colSpan: 1, styles: CENTER }]]
				: [
						valueRow('Income', (row) => row.income, totals.income),
						valueRow('Cost of Goods Sold', (row) => row.cogs, totals.cogs)
					],
		foot:
			monthly.length === 0
				? undefined
				: [
						[
							'Gross Profit',
							...monthly.map((row) => ({
								content: formatCurrencyPdf(row.gross_profit),
								styles: RIGHT
							})),
							...(showTotalCol
								? [{ content: formatCurrencyPdf(totals.grossProfit), styles: RIGHT }]
								: [])
						],
						marginRow
					],
		theme: 'grid',
		styles: BASE_STYLES,
		headStyles: HEAD_STYLES,
		columnStyles
	});
	return tableFinalY(doc, y) + 14;
}

function drawDetailTable(
	doc: jsPDF,
	detail: ProfitLossDetailRow[],
	margin: number,
	y: number
): number {
	const totals = detail.reduce(
		(acc, row) => {
			acc.quantitySold += row.quantity_sold;
			acc.revenue += safeNum(row.total_revenue);
			acc.cost += safeNum(row.total_cost);
			acc.profit += safeNum(row.profit);
			return acc;
		},
		{ quantitySold: 0, revenue: 0, cost: 0, profit: 0 }
	);

	const body: CellInput[][] =
		detail.length === 0
			? [[{ content: EMPTY_TEXT, colSpan: 7, styles: CENTER }]]
			: detail.map((row) => [
					row.product_sku,
					row.product_name,
					{ content: String(row.quantity_sold), styles: RIGHT },
					{ content: formatCurrencyPdf(row.total_revenue), styles: RIGHT },
					{ content: formatCurrencyPdf(row.total_cost), styles: RIGHT },
					{ content: formatCurrencyPdf(row.profit), styles: RIGHT },
					{
						content: `${grossMarginPercent(safeNum(row.total_revenue), safeNum(row.profit))}%`,
						styles: RIGHT
					}
				]);

	autoTable(doc, {
		startY: y,
		margin: { left: margin, right: margin, top: 8, bottom: 48 },
		head: [['SKU', 'Product', 'Qty Sold', 'Revenue', 'Cost', 'Profit', 'Margin %']],
		body,
		foot:
			detail.length === 0
				? undefined
				: [
						[
							{ content: 'Total', colSpan: 2 },
							{ content: String(totals.quantitySold), styles: RIGHT },
							{ content: formatCurrencyPdf(totals.revenue), styles: RIGHT },
							{ content: formatCurrencyPdf(totals.cost), styles: RIGHT },
							{ content: formatCurrencyPdf(totals.profit), styles: RIGHT },
							{ content: `${grossMarginPercent(totals.revenue, totals.profit)}%`, styles: RIGHT }
						]
					],
		theme: 'grid',
		styles: BASE_STYLES,
		headStyles: HEAD_STYLES,
		columnStyles: {
			// mirrors the preview's monospace SKU column
			0: { cellWidth: 70, font: 'courier', fontSize: 8 },
			2: { halign: 'right', cellWidth: 55 },
			3: { halign: 'right', cellWidth: 85 },
			4: { halign: 'right', cellWidth: 85 },
			5: { halign: 'right', cellWidth: 85 },
			6: { halign: 'right', cellWidth: 60 }
		}
	});
	return tableFinalY(doc, y);
}

// ── Builder ───────────────────────────────────────────────────────

export async function buildProfitLossPdf(
	data: ProfitLossData,
	view: ProfitLossView,
	filters?: { from?: string | null; to?: string | null }
): Promise<jsPDF> {
	const showMonthly = view === 'summary' || view === 'both';
	const landscape = showMonthly && data.monthly.length > PORTRAIT_MONTH_LIMIT;
	const { doc, margin, startY } = await createReportDoc({
		title: viewTitle(view),
		subtitle: dateRangeLabel(filters),
		orientation: landscape ? 'landscape' : 'portrait'
	});

	let y = startY;
	if (showMonthly) {
		y = drawOverallTotals(doc, data.summary, margin, y);
		y = drawMonthlyTable(doc, data.monthly, margin, y);
	}

	if (view === 'both') {
		// the preview's forced .page-break + "By Product" heading
		doc.addPage();
		y = 48;
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(13);
		doc.text('By Product', margin, y + 14);
		y += 26;
	}

	if (view === 'detail' || view === 'both') {
		drawDetailTable(doc, data.detail, margin, y);
	}

	addReportFooter(doc);
	return doc;
}
