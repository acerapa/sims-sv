import autoTable, { type CellHookData, type CellInput, type Styles } from 'jspdf-autotable';
import { jsPDF } from 'jspdf';
import {
	REPORT_MARGIN,
	LOGO_GAP,
	LOGO_SIZE,
	PDF_FOOTER_BAND,
	addReportFooter,
	ensureSpace,
	drawSignatures,
	formatCurrencyPdf,
	loadLogoDataUrl,
	safeNum,
	tableFinalY
} from '#lib/utils/pdf.ts';

type Amount = number | string | null | undefined;

// Supported paper formats for the D.R. — both are 8.5in wide, so every column width and
// the 531.9pt table invariant hold for either; only the page height changes
export type DrPaperFormat = 'letter' | 'legal';

export interface DeliveryReceiptItem {
	quantity: number;
	unit_price: Amount;
	total_price: Amount;
	serial_number?: string | null;
	product?: { sales_description?: string | null } | null;
	package?: { name?: string | null } | null;
}

// Structural twin of getSalesOrder (declared locally — no $lib/server import)
export interface DeliveryReceiptOrder {
	id: number;
	date_ordered: Date | string;
	total_cost: Amount;
	customer?: { name?: string | null; address?: string | null } | null;
	staff?: { name?: string | null } | null;
	items?: DeliveryReceiptItem[];
}

// Verbatim client copy — rewording is a client change, not a code fix (spec Note N2)
export const WARRANTY_TEXT =
	"RAM TECH VENTURES INC. is offering a Standard Warranty for it's Major products. " +
	'When seeking diagnose from RAM TECH VENTURES INC. authorized technician, present this ' +
	'warranty delivery slip and a copy of your PROOF OF PURCHASE: Sales Invoice, Delivery Slip, ' +
	'Change Invoice or Office Receipt together with the faulty equipment. During the applicable ' +
	"warranty period, RAM TECH VENTURES INC. at it's parts: PROCESSOR, MOTHERBOARD, RAM, SSD, " +
	'HDD, PRINTER, UPS, MONITOR, POWER SUPPLY, DVR, NVR, ANALOG CAMERA, IP CAMERA, will repair ' +
	'such equipment charge at shipment charge only. Defective equipment, accessories and spare ' +
	'parts shall become RAM TECH VENTURES INC. properly. Replaced equipment and spare parts are ' +
	'warranted for the balance of the applicable warranty period.';

const BASE_STYLES: Partial<Styles> = {
	font: 'helvetica',
	fontSize: 9,
	cellPadding: 5,
	lineColor: 0,
	lineWidth: 0.5,
	textColor: [17, 17, 17]
};

const HEAD_STYLES: Partial<Styles> = {
	font: 'helvetica',
	fontSize: 9,
	fontStyle: 'normal',
	fillColor: [255, 255, 255],
	textColor: [17, 17, 17],
	halign: 'center'
};

const DATA_ROW_HEIGHT = 26; // 9mm — spacer + totals rows (the preview's 9mm rows)
// Client 2026-11-09: compact item rows; 2026-11-16: 13pt (≈4.6mm) — one pt per item buys the
// signature its bottom clearance on full tables, where no spacer row is left to shave
const ITEM_ROW_HEIGHT = 13;
// column widths: Serial No., UP and Total size to this receipt's widest value and Item
// Description absorbs the rest — client 2026-11: the fixed amount widths left a blank gap
// before the right-aligned amounts
const QTY_W = 37.2;
const SERIAL_FALLBACK = 85.1;
const AMOUNT_PAD = 10; // left+right 5pt cell padding on the amount cells
const UP_FLOOR = 24; // "UP" header + AMOUNT_PAD
const TOTAL_FLOOR = 42; // "Php 0.00" (the totals rows) + AMOUNT_PAD
const UNIT_PRICE_MAX = 56; // worst case: bare "999,999.99" + AMOUNT_PAD
const TOTAL_MAX = 82; // worst case: "Php 999,999.99" on the totals rows + AMOUNT_PAD
// 271.6: description's share at the serial floor with worst-case amount columns — includes
// the 7.8pt freed by dropping "Php" from the item rows
const TABLE_WIDTH = 271.6 + SERIAL_FALLBACK + QTY_W + UNIT_PRICE_MAX + TOTAL_MAX; // 531.9pt, invariant

// +12pt of cell padding; capped at 150pt so a huge serial wraps inside its cell instead of
// squashing the description column
export function serialColumnWidth(doc: jsPDF, serials: string[]): number {
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(9);
	const longest = serials.reduce((max, value) => Math.max(max, doc.getTextWidth(value)), 0);
	return Math.min(150, Math.max(SERIAL_FALLBACK, Math.ceil(longest) + 12));
}

// the same fit as a share of the table width — the on-screen preview sizes its column with it
export function serialWPercent(serials: string[]): number {
	const doc = new jsPDF({ unit: 'pt' });
	return (serialColumnWidth(doc, serials) / TABLE_WIDTH) * 100;
}

// The UP/Total columns fit this receipt's widest value — headers and the "Php …" totals-row
// amounts included — and share the preview-fit percents below
function fitAmountColumn(doc: jsPDF, values: string[], floor: number): number {
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(9);
	const widest = values.reduce((max, value) => Math.max(max, doc.getTextWidth(value)), 0);
	return Math.max(floor, Math.ceil(widest) + AMOUNT_PAD);
}

export function upColumnWidth(doc: jsPDF, items: DeliveryReceiptItem[]): number {
	return fitAmountColumn(
		doc,
		['UP', ...items.map((item) => plainAmount(item.unit_price))],
		UP_FLOOR
	);
}

export function totalColumnWidth(
	doc: jsPDF,
	items: DeliveryReceiptItem[],
	subtotal: number,
	grandTotal: Amount
): number {
	return fitAmountColumn(
		doc,
		[
			'Total',
			...items.map((item) => plainAmount(item.total_price)),
			formatCurrencyPdf(subtotal),
			formatCurrencyPdf(grandTotal)
		],
		TOTAL_FLOOR
	);
}

export function upWPercent(items: DeliveryReceiptItem[]): number {
	const doc = new jsPDF({ unit: 'pt' });
	return (upColumnWidth(doc, items) / TABLE_WIDTH) * 100;
}

export function totalWPercent(
	items: DeliveryReceiptItem[],
	subtotal: number,
	grandTotal: Amount
): number {
	const doc = new jsPDF({ unit: 'pt' });
	return (totalColumnWidth(doc, items, subtotal, grandTotal) / TABLE_WIDTH) * 100;
}

// short date ("Sep 11, 2026") for the 66pt DATE cell in the reference grid — it must fit the
// box (the client sample prints "Oct 14, 2019"). Shared with the on-screen preview for parity.
export function formatDateShort(value: Date | string | number | null | undefined): string {
	if (value == null || value === '') return '';
	return new Date(value).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}

function formCell(value: string | number, minCellHeight: number): CellInput {
	return { content: value, styles: { minCellHeight } };
}

// Item rows print bare amounts — the "Php" prefix stays only on the SUB-TOTAL / TOTAL
// AMOUNT rows (client, 2026-11)
function plainAmount(value: Amount): string {
	const num = typeof value === 'string' ? parseFloat(value || '0') : (value ?? 0);
	return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Client 2026-11-09: compact rows, flush vertically; small x padding keeps the text
// readable and aligned with the header/totals columns
const itemCell = (value: string | number): CellInput => ({
	content: value,
	styles: { minCellHeight: ITEM_ROW_HEIGHT, cellPadding: { top: 0, bottom: 0, left: 5, right: 5 } }
});

// First line only — a value that does not fit its reference-grid cell is clipped, not reflowed
function fitOneLine(doc: jsPDF, text: string, width: number): string {
	return doc.splitTextToSize(text, width)[0] ?? '';
}

function drawHeader(doc: jsPDF, order: DeliveryReceiptOrder, logoData: string | undefined): void {
	const pageWidth = doc.internal.pageSize.getWidth();
	const margin = REPORT_MARGIN;

	let nameX = margin + 12;
	if (logoData) {
		doc.addImage(logoData, 'JPEG', margin, 34, LOGO_SIZE, LOGO_SIZE);
		nameX = margin + LOGO_SIZE + LOGO_GAP;
	}

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(15);
	// client 2026-10-30: name is bold, no border box
	doc.text('RAM TECH VENTURES INC.', nameX, 52);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8.5);
	doc.text('BARTOLOME BLDG., MAGSAYSAY ST. BLVD.', margin, 96);
	doc.text('BRGY. EAST AWANG POB.,', margin, 106);
	doc.text('CALBAYOG CITY, SAMAR', margin, 116);

	// D.R title, top-right (client layout)
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(26);
	doc.text('D.R', pageWidth - margin, 56, { align: 'right' });

	// Reference table (2 rows x 2 cols): row 1 DATE · S.O. NO.; row 2 P.O. NO. · REP
	// (P.O. NO. intentionally blank — see spec) — compact half-size grid (client direction, 2026-10-30)
	const gridW = 132;
	const colW = gridW / 2;
	const gridX = pageWidth - margin - gridW;
	const refY = 68;
	const rowH = 25;
	doc.setDrawColor(0, 0, 0);
	doc.setLineWidth(0.5);
	for (let row = 0; row < 2; row++) {
		for (let col = 0; col < 2; col++) {
			doc.rect(gridX + col * colW, refY + row * rowH, colW, rowH);
		}
	}
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8.5); // size used for values — rep-name clipping must measure at render size
	const refCells = [
		[
			['DATE', formatDateShort(order.date_ordered)],
			['S.O. NO.', String(order.id)]
		],
		[
			['P.O. NO.', ''],
			['REP', fitOneLine(doc, order.staff?.name || '', colW - 12)]
		]
	];
	refCells.forEach((row, r) =>
		row.forEach((cell, c) => {
			const x = gridX + c * colW + 5;
			doc.setFont('helvetica', 'bold');
			doc.setFontSize(7.5);
			doc.text(cell[0], x, refY + r * rowH + 10);
			doc.setFont('helvetica', 'normal');
			doc.setFontSize(8.5);
			doc.text(cell[1], x, refY + r * rowH + 21);
		})
	);
}

function drawNameAddress(doc: jsPDF, order: DeliveryReceiptOrder, y: number): number {
	const margin = REPORT_MARGIN;
	const titleH = 20; // 7mm
	const addressLines = measureAddressLines(doc, order.customer?.address);
	const boxH = nameBoxHeight(addressLines.length);
	doc.setDrawColor(0, 0, 0);
	doc.setLineWidth(1);
	doc.rect(margin, y, DR_NAME_BOX_W, boxH);
	doc.line(margin, y + titleH, margin + DR_NAME_BOX_W, y + titleH);
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(10);
	doc.text('Name/Address', margin + 6, y + 13);

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(11);
	doc.text(order.customer?.name || '—', margin + 6, y + titleH + 14);
	for (let i = 0; i < addressLines.length; i++) {
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(9);
		doc.text(addressLines[i], margin + 6, y + titleH + 30 + i * 12);
	}
	return y + boxH + DR_NAME_BOX_GAP;
}

function drawItemsTable(
	doc: jsPDF,
	order: DeliveryReceiptOrder,
	y: number,
	spacerRows = 0
): number {
	const items = order.items ?? [];
	const serialW = serialColumnWidth(
		doc,
		items.map((item) => String(item.serial_number ?? ''))
	);
	const subtotal = items.reduce((sum, item) => sum + safeNum(item.total_price), 0);
	const upW = upColumnWidth(doc, items);
	const totalW = totalColumnWidth(doc, items, subtotal, order.total_cost);
	const rows: CellInput[][] = items.map((item) => {
		const name = item.package?.name || item.product?.sales_description || '—';
		return [
			itemCell(name),
			itemCell(item.serial_number || ''),
			itemCell(item.quantity),
			itemCell(plainAmount(item.unit_price)),
			itemCell(plainAmount(item.total_price))
		];
	});

	// Client 2026-10-30: extend the items table so the warranty block + signatures close the page
	// — spacers keep the full row height: they are the filler that absorbs the freed space
	for (let i = 0; i < spacerRows; i++) {
		rows.push(['', '', '', '', ''].map((value) => formCell(value, DATA_ROW_HEIGHT)));
	}

	// Client 2026-11: the totals are the table's final rows (no separate box) — label first
	// column, value rightmost column, table-weight type (TOTAL AMOUNT bold)
	const boldCell = (value: string): CellInput => ({
		content: value,
		styles: { minCellHeight: DATA_ROW_HEIGHT, fontStyle: 'bold' }
	});
	rows.push([
		boldCell('SUB-TOTAL'),
		formCell('', DATA_ROW_HEIGHT),
		formCell('', DATA_ROW_HEIGHT),
		formCell('', DATA_ROW_HEIGHT),
		formCell(formatCurrencyPdf(subtotal), DATA_ROW_HEIGHT)
	]);
	rows.push([
		boldCell('TOTAL AMOUNT'),
		formCell('', DATA_ROW_HEIGHT),
		formCell('', DATA_ROW_HEIGHT),
		formCell('', DATA_ROW_HEIGHT),
		boldCell(formatCurrencyPdf(order.total_cost))
	]);

	// lineWidth is per-cell (all four sides), so "no top/bottom borders" isn't expressible in
	// bodyStyles alone — keep the body borderless and draw the column edges manually
	const drawColumnBorders = (data: CellHookData) => {
		if (data.section !== 'body') return;
		const { x, y: cellY, width, height } = data.cell;
		// Client 2026-11-09: the totals rows read as clean label/amount lines — skip the
		// internal vertical dividers there, keeping only the table's outer edges
		const inTotalsRow = data.row.index >= rows.length - DR_TOTAL_ROWS;
		const atLeftEdge = Math.abs(x - REPORT_MARGIN) < 0.01;
		const atRightEdge = Math.abs(x + width - (REPORT_MARGIN + TABLE_WIDTH)) < 0.01;
		if (inTotalsRow && !atLeftEdge && !atRightEdge) return;
		doc.setDrawColor(0, 0, 0);
		doc.setLineWidth(0.5);
		if (!inTotalsRow || atLeftEdge) doc.line(x, cellY, x, cellY + height);
		if (!inTotalsRow || atRightEdge) doc.line(x + width, cellY, x + width, cellY + height);
	};

	autoTable(doc, {
		startY: y,
		margin: { left: REPORT_MARGIN, right: REPORT_MARGIN, top: 6, bottom: 48 },
		head: [['Item Description', 'Serial No.', 'Qty', 'UP', 'Total']],
		body: rows,
		theme: 'grid',
		styles: BASE_STYLES,
		headStyles: HEAD_STYLES,
		bodyStyles: { lineWidth: 0 },
		didDrawCell: drawColumnBorders,
		columnStyles: {
			// Serial No., UP and Total fit this receipt's values (serialColumnWidth,
			// upColumnWidth, totalColumnWidth) — the Item Description column absorbs the
			// difference so the table total stays 531.9pt
			0: { cellWidth: TABLE_WIDTH - serialW - QTY_W - upW - totalW },
			1: { cellWidth: serialW },
			2: { cellWidth: QTY_W, halign: 'right' },
			3: { cellWidth: upW, halign: 'right' },
			4: { cellWidth: totalW, halign: 'right' }
		}
	});

	// Client 2026-11: rule the two totals rows — a top border, the rule between them and a
	// bottom border closing the table above the warranty (vertical edges come from the
	// column-borders hook). Skipped when a page break split the two rows (long receipts).
	const at = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
	if (at) {
		const totalTop = at.finalY - 2 * DATA_ROW_HEIGHT;
		if (totalTop > 0) {
			doc.setDrawColor(0, 0, 0);
			doc.setLineWidth(0.5);
			for (const lineY of [totalTop, at.finalY - DATA_ROW_HEIGHT, at.finalY]) {
				doc.line(REPORT_MARGIN, lineY, REPORT_MARGIN + TABLE_WIDTH, lineY);
			}
		}
	}

	return tableFinalY(doc, y);
}

function drawWarranty(doc: jsPDF, y: number): number {
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const margin = REPORT_MARGIN;

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(10);
	doc.text('FOR WARRANTY SERVICE:', pageWidth / 2, y, { align: 'center' });
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8.5);
	const lines = doc.splitTextToSize(WARRANTY_TEXT, pageWidth - margin * 2);

	let lineY = y + 12;
	for (const line of lines) {
		lineY = ensureSpace(doc, lineY, 12, pageHeight);
		doc.text(line, margin, lineY);
		lineY += 12;
	}
	return lineY + 8;
}
const DR_HEADER_H = 132; // fixed header's last rule — the Name/Address box starts here
const DR_NAME_BOX_W = 255; // 48% of the printable width
const DR_NAME_BOX_GAP = 14; // gap from the box bottom to the items table
const DR_ITEMS_TOP = 204; // DR_HEADER_H + one-line box (58) + gap — drSpacerRows' default;
// buildDrPdf passes the ACTUAL top and the preview passes drItemsTop() (the box grows
// with the address length)
const DR_TABLE_HEAD = 20; // autotable header row (9pt cell + padding)
const DR_TOTAL_ROWS = 2; // SUB-TOTAL + TOTAL AMOUNT are the table's final rows (client, 2026-11)
const DR_BELOW_TABLE = 124; // 20 gap + warranty (heading 12 + 7×12 lines + advance/return, ≈ 104)
// drawSignatures() geometry: the second row's rule sits at y+50 and its role text baseline
// at y+75, so the block spans 75pt + ~2pt descender. The old 90pt reserve pushed the
// signatures to page 2 while ~15pt of page 1 still stood free — the client's "new page even
// though the table isn't full" (2026-11); reserving the block's true height only breaks
// when the page is genuinely full
const DR_SIG_NEED = 77;
// Extra room below the signature block, beyond its 77pt height: DR_SIG_NEED is exact, so a
// table filled to the brim left the block's descenders only ~48pt above the paper edge
// (measured 743.4pt on a 792pt page) — clipped on printers with a wider bottom margin.
// 20pt more keeps a one-page D.R.'s block bottom at least ~68pt (24mm) from the edge
// (client, 2026-11-16).
const DR_SIG_CLEARANCE = 20;
// autotable's finalY runs ~0.4pt over the integer row math (head-row padding), so a table
// that exactly fills the target would trip the strict page-break check a hair over the
// limit and wobble to page 2 — one pt of tolerance keeps exactly-fitting tables on page 1
const DR_FIT_TOLERANCE = 1;
// letter and legal page heights in pt (legal = 8.5in x 14in)
const PAGE_HEIGHT_PT: Record<DrPaperFormat, number> = { letter: 792, legal: 1008 };

// Box height fits its content (client, 2026-11): name zone + one 12pt per wrapped address
// line + padding; was a fixed 96pt with a clipped 5-line cap
function nameBoxHeight(addressLineCount: number): number {
	return Math.max(50, 36 + addressLineCount * 12 + 10);
}

// Address lines at render size (9pt) — the one wrap rule shared by the PDF's Name/Address
// box and the preview's spacer math, so the two can't drift apart
function measureAddressLines(doc: jsPDF, address: string | null | undefined): string[] {
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(9);
	return address ? doc.splitTextToSize(address, DR_NAME_BOX_W - 12) : [];
}

// Items-table top for a customer address: the same math drawNameAddress draws, so the
// on-screen preview computes its spacer rows from the PDF's real table top (a multi-line
// address used to desync the two — the preview assumed DR_ITEMS_TOP and over-stretched)
export function drItemsTop(address: string | null | undefined): number {
	const doc = new jsPDF({ unit: 'pt' });
	const lines = measureAddressLines(doc, address).length;
	return DR_HEADER_H + nameBoxHeight(lines) + DR_NAME_BOX_GAP;
}

/**
 * Client 2026-10-30: "extend the table and push the warranty text and the signatures
 * to the bottom" — the blank table rows that absorb the free space for this item
 * count so the warranty paragraph opens right below the table and the signatures
 * close the page (single-page orders). Shared with the on-screen preview so both
 * show the same layout (parity). Long orders return 0 and keep their natural flow.
 */
export function drSpacerRows(
	itemCount: number,
	itemsTop: number = DR_ITEMS_TOP,
	format: DrPaperFormat = 'letter'
): number {
	const pageHeight = PAGE_HEIGHT_PT[format];
	const maxTableBottom =
		pageHeight - PDF_FOOTER_BAND - DR_SIG_NEED - DR_SIG_CLEARANCE - DR_BELOW_TABLE;
	const naturalBottom =
		itemsTop +
		DR_TABLE_HEAD +
		Math.max(0, itemCount) * ITEM_ROW_HEIGHT +
		DR_TOTAL_ROWS * DATA_ROW_HEIGHT;
	const gap = maxTableBottom - naturalBottom;
	return gap > 0 ? Math.floor(gap / DATA_ROW_HEIGHT) : 0;
}

export async function buildDrPdf(
	order: DeliveryReceiptOrder,
	format: DrPaperFormat = 'letter'
): Promise<jsPDF> {
	// No createReportDoc on purpose: the D.R. has its own form anatomy (logo + boxed company
	// name + D.R title + reference grid) — the client form, not the report frame, is the source
	// of truth (same call as the sibling daily-sales receipt).
	const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format });
	const pageHeight = doc.internal.pageSize.getHeight();
	const logoData = await loadLogoDataUrl();

	let y = DR_HEADER_H;
	drawHeader(doc, order, logoData);
	y = drawNameAddress(doc, order, y);
	// pass the real table top: the Name/Address box is now content-sized, so the
	// spacer count must follow it to keep the warranty block anchored to the page bottom
	y = drawItemsTable(doc, order, y, drSpacerRows(order.items?.length ?? 0, y, format)) + 20;
	y = drawWarranty(doc, y);
	// the same clearance as the spacer math, so multi-page receipts keep it too
	y = ensureSpace(doc, y, DR_SIG_NEED + DR_SIG_CLEARANCE - DR_FIT_TOLERANCE, pageHeight);
	drawSignatures(doc, y);

	addReportFooter(doc);
	return doc;
}
