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
} from '$lib/utils/pdf';

type Amount = number | string | null | undefined;

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
// Client 2026-11-09: compact item rows — 14pt ≈ 5mm, the preview's item-row height;
// spacers/totals keep DATA_ROW_HEIGHT so the page-fill math and totals ruling hold
const ITEM_ROW_HEIGHT = 14;
// column widths: Total widened so "Php #,###.##" stays on one line; Serial No. is sized to
// the receipt’s longest value and Item Description absorbs the difference (client, 2026-11)
const QTY_W = 37.2;
const UNIT_PRICE_W = 63.8;
const TOTAL_W = 82;
const SERIAL_FALLBACK = 85.1;
const TABLE_WIDTH = 263.8 + SERIAL_FALLBACK + QTY_W + UNIT_PRICE_W + TOTAL_W; // 531.9pt, invariant

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
	const boxW = 255; // 48% of the printable width
	const titleH = 20; // 7mm
	const addressLines: string[] = order.customer?.address
		? doc.splitTextToSize(order.customer.address, boxW - 12)
		: [];
	// box height fits its content (client, 2026-11): name zone + one 12pt per wrapped
	// address line + padding; was a fixed 96pt with a clipped 5-line cap
	const boxH = Math.max(50, 36 + addressLines.length * 12 + 10);
	doc.setDrawColor(0, 0, 0);
	doc.setLineWidth(1);
	doc.rect(margin, y, boxW, boxH);
	doc.line(margin, y + titleH, margin + boxW, y + titleH);
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
	return y + boxH + 14;
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
	const rows: CellInput[][] = items.map((item) => {
		const name = item.package?.name || item.product?.sales_description || '—';
		return [
			itemCell(name),
			itemCell(item.serial_number || ''),
			itemCell(item.quantity),
			itemCell(formatCurrencyPdf(item.unit_price)),
			itemCell(formatCurrencyPdf(item.total_price))
		];
	});

	// Client 2026-10-30: extend the items table so the warranty block + signatures close the page
	// — spacers keep the full row height: they are the filler that absorbs the freed space
	for (let i = 0; i < spacerRows; i++) {
		rows.push(['', '', '', '', ''].map((value) => formCell(value, DATA_ROW_HEIGHT)));
	}

	// Client 2026-11: the totals are the table's final rows (no separate box) — label first
	// column, value rightmost column, table-weight type (TOTAL AMOUNT bold)
	const subtotal = (order.items ?? []).reduce((sum, item) => sum + safeNum(item.total_price), 0);
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
			// Serial No. fits this receipt’s longest value (serialColumnWidth) — the Item
			// Description column absorbs the difference so the table total stays 531.9pt
			0: { cellWidth: TABLE_WIDTH - serialW - QTY_W - UNIT_PRICE_W - TOTAL_W },
			1: { cellWidth: serialW },
			2: { cellWidth: QTY_W, halign: 'right' },
			3: { cellWidth: UNIT_PRICE_W, halign: 'right' },
			4: { cellWidth: TOTAL_W, halign: 'right' }
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
const DR_ITEMS_TOP = 204; // header (132) + content-sized Name/Address (1-line address) → items-table top;
// buildDrPdf passes the ACTUAL top (the box grows with the address length)
const DR_TABLE_HEAD = 20; // autotable header row (9pt cell + padding)
const DR_TOTAL_ROWS = 2; // SUB-TOTAL + TOTAL AMOUNT are the table's final rows (client, 2026-11)
const DR_BELOW_TABLE = 124; // 20 gap + warranty (heading 12 + 7×12 lines + advance/return, ≈ 104)
const DR_SIG_NEED = 90; // the ensureSpace() budget the signature blocks need to stay on page 1

/**
 * Client 2026-10-30: "extend the table and push the warranty text and the signatures
 * to the bottom" — the blank table rows that absorb the free space for this item
 * count so the warranty paragraph opens right below the table and the signatures
 * close the page (single-page orders). Shared with the on-screen preview so both
 * show the same layout (parity). Long orders return 0 and keep their natural flow.
 */
export function drSpacerRows(itemCount: number, itemsTop: number = DR_ITEMS_TOP): number {
	const pageHeight = 792; // letter, pt
	const maxTableBottom = pageHeight - PDF_FOOTER_BAND - DR_SIG_NEED - DR_BELOW_TABLE;
	const naturalBottom =
		itemsTop +
		DR_TABLE_HEAD +
		Math.max(0, itemCount) * ITEM_ROW_HEIGHT +
		DR_TOTAL_ROWS * DATA_ROW_HEIGHT;
	const gap = maxTableBottom - naturalBottom;
	return gap > 0 ? Math.floor(gap / DATA_ROW_HEIGHT) : 0;
}

export async function buildDrPdf(order: DeliveryReceiptOrder): Promise<jsPDF> {
	// No createReportDoc on purpose: the D.R. has its own form anatomy (logo + boxed company
	// name + D.R title + reference grid) — the client form, not the report frame, is the source
	// of truth (same call as the sibling daily-sales receipt).
	const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
	const pageHeight = doc.internal.pageSize.getHeight();
	const logoData = await loadLogoDataUrl();

	let y = 132;
	drawHeader(doc, order, logoData);
	y = drawNameAddress(doc, order, y);
	// pass the real table top: the Name/Address box is now content-sized, so the
	// spacer count must follow it to keep the warranty block anchored to the page bottom
	y = drawItemsTable(doc, order, y, drSpacerRows(order.items?.length ?? 0, y)) + 20;
	y = drawWarranty(doc, y);
	y = ensureSpace(doc, y, 90, pageHeight);
	drawSignatures(doc, y);

	addReportFooter(doc);
	return doc;
}
