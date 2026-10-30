import autoTable, { type CellInput, type Styles } from 'jspdf-autotable';
import { jsPDF } from 'jspdf';
import {
	REPORT_MARGIN,
	LOGO_GAP,
	LOGO_SIZE,
	addReportFooter,
	ensureSpace,
	formatCurrencyPdf,
	formatDatePdf,
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
	fontSize: 8,
	cellPadding: 4,
	lineColor: 0,
	lineWidth: 0.5,
	textColor: [17, 17, 17]
};

const HEAD_STYLES: Partial<Styles> = {
	font: 'helvetica',
	fontSize: 8,
	fontStyle: 'normal',
	textColor: [17, 17, 17],
	halign: 'center'
};

const DATA_ROW_HEIGHT = 23; // 8mm, the preview's items-table row height

function formCell(value: string | number, minCellHeight: number): CellInput {
	return { content: value, styles: { minCellHeight } };
}

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
	doc.setFontSize(13);
	const companyName = 'RAM TECH VENTURES INC.';
	doc.text(companyName, nameX, 52);
	doc.setDrawColor(0, 0, 0);
	doc.setLineWidth(1);
	doc.rect(nameX - 5, 38, doc.getTextWidth(companyName) + 10, 20);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(7.5);
	doc.text('BARTOLOME BLDG., MAGSAYSAY ST. BLVD.', margin, 96);
	doc.text('BRGY. EAST AWANG POB.,', margin, 105);
	doc.text('CALBAYOG CITY, SAMAR', margin, 114);

	// D.R title, top-right (client layout)
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(24);
	doc.text('D.R', pageWidth - margin, 56, { align: 'right' });

	// Reference grid under the title: DATE · S.O. NO. · P.O. NO. · REP (P.O. NO. intentionally blank)
	const gridW = 264;
	const colW = gridW / 4;
	const gridX = pageWidth - margin - gridW;
	const refY = 70;
	const headH = 16;
	const valueH = 16;
	doc.setDrawColor(0, 0, 0);
	doc.setLineWidth(0.5);
	[0, 1, 2, 3].forEach((i) => {
		doc.rect(gridX + i * colW, refY, colW, headH);
		doc.rect(gridX + i * colW, refY + headH, colW, valueH);
	});
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(7.5);
	['DATE', 'S.O. NO.', 'P.O. NO.', 'REP'].forEach((label, i) =>
		doc.text(label, gridX + (i + 0.5) * colW, refY + 10.5, { align: 'center' })
	);
	doc.setFontSize(8);
	const values = [
		formatDatePdf(order.date_ordered),
		String(order.id),
		'',
		fitOneLine(doc, order.staff?.name || '', colW - 4)
	];
	values.forEach((value, i) =>
		doc.text(value, gridX + (i + 0.5) * colW, refY + headH + 10.5, { align: 'center' })
	);
}

function drawNameAddress(doc: jsPDF, order: DeliveryReceiptOrder, y: number): number {
	const margin = REPORT_MARGIN;
	const boxW = 255; // 48% of the printable width
	const boxH = 90;
	doc.setDrawColor(0, 0, 0);
	doc.setLineWidth(1);
	doc.rect(margin, y, boxW, boxH);
	const titleH = 20; // 7mm
	doc.line(margin, y + titleH, margin + boxW, y + titleH);
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(9);
	doc.text('Name/Address', margin + 6, y + 13);

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(10);
	doc.text(order.customer?.name || '—', margin + 6, y + titleH + 14);
	if (order.customer?.address) {
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(8);
		doc
			.splitTextToSize(order.customer.address, boxW - 12)
			.slice(0, 5)
			.forEach((line: string, i: number) => {
				doc.text(line, margin + 6, y + titleH + 28 + i * 11);
			});
	}
	return y + boxH + 14;
}

function drawItemsTable(doc: jsPDF, order: DeliveryReceiptOrder, y: number): number {
	const items = order.items ?? [];
	const rows: CellInput[][] = items.map((item) => {
		const name = item.package?.name || item.product?.sales_description || '—';
		return [
			formCell(name, DATA_ROW_HEIGHT),
			formCell(item.serial_number || '', DATA_ROW_HEIGHT),
			formCell(item.quantity, DATA_ROW_HEIGHT),
			formCell(formatCurrencyPdf(item.unit_price), DATA_ROW_HEIGHT),
			formCell(formatCurrencyPdf(item.total_price), DATA_ROW_HEIGHT)
		];
	});

	autoTable(doc, {
		startY: y,
		margin: { left: REPORT_MARGIN, right: REPORT_MARGIN, top: 6, bottom: 48 },
		head: [['Item Description', 'Serial No.', 'Qty', 'UP', 'Total']],
		body: rows,
		theme: 'grid',
		styles: BASE_STYLES,
		headStyles: HEAD_STYLES,
		columnStyles: {
			// 55 / 16 / 7 / 10 / 12 % of the printable width (the sibling receipt's ratios, in this order)
			0: { cellWidth: 292.6 },
			1: { cellWidth: 85.1 },
			2: { cellWidth: 37.2, halign: 'right' },
			3: { cellWidth: 53.2, halign: 'right' },
			4: { cellWidth: 63.8, halign: 'right' }
		}
	});
	return tableFinalY(doc, y);
}

function drawTotals(doc: jsPDF, order: DeliveryReceiptOrder, y: number): number {
	const pageWidth = doc.internal.pageSize.getWidth();
	const boxW = 213; // 40% of the printable width
	const boxX = pageWidth - REPORT_MARGIN - boxW;
	const subtotal = (order.items ?? []).reduce((sum, item) => sum + safeNum(item.total_price), 0);

	doc.setDrawColor(0, 0, 0);
	doc.setLineWidth(1);
	doc.rect(boxX, y, boxW, 19);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9);
	doc.text('SUB-TOTAL', boxX + 6, y + 13);
	doc.setFont('helvetica', 'normal');
	doc.text(formatCurrencyPdf(subtotal), boxX + boxW - 6, y + 13, { align: 'right' });

	// ruled grand total; order.total_cost is the authoritative figure (spec Note N1)
	doc.rect(boxX, y + 19, boxW, 24);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(11);
	doc.text('TOTAL AMOUNT', boxX + 6, y + 35);
	doc.text(formatCurrencyPdf(order.total_cost), boxX + boxW - 6, y + 35, { align: 'right' });
	return y + 43 + 16;
}

function drawWarranty(doc: jsPDF, y: number): number {
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const margin = REPORT_MARGIN;

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9);
	doc.text('FOR WARRANTY SERVICE:', pageWidth / 2, y, { align: 'center' });
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(7.5);
	const lines = doc.splitTextToSize(WARRANTY_TEXT, pageWidth - margin * 2);

	let lineY = y + 11;
	for (const line of lines) {
		lineY = ensureSpace(doc, lineY, 10, pageHeight);
		doc.text(line, margin, lineY);
		lineY += 10;
	}
	return lineY + 8;
}

function drawSignatures(doc: jsPDF, y: number): void {
	const pageWidth = doc.internal.pageSize.getWidth();
	const margin = REPORT_MARGIN;
	const lineW = 170;
	const leftX = margin + 20;
	const rightX = pageWidth - margin - 20 - lineW;
	const centerX = pageWidth / 2 - lineW / 2;

	const drawOne = (x: number, sy: number, role: string) => {
		doc.setDrawColor(0, 0, 0);
		doc.setLineWidth(0.8);
		doc.line(x, sy, x + lineW, sy);
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(8);
		doc.text('Signature over Printed Name', x + lineW / 2, sy + 12, { align: 'center' });
		doc.setFont('helvetica', 'bold');
		doc.text(role, x + lineW / 2, sy + 23, { align: 'center' });
	};

	drawOne(leftX, y, 'Inventory');
	drawOne(rightX, y, 'Received By');
	drawOne(centerX, y + 44, 'Branch Manager');
}

export async function buildDrPdf(order: DeliveryReceiptOrder): Promise<jsPDF> {
	// No createReportDoc on purpose: the D.R. has its own form anatomy (logo + boxed company
	// name + D.R title + reference grid) — the client form, not the report frame, is the source
	// of truth (same call as the sibling daily-sales receipt).
	const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
	const pageHeight = doc.internal.pageSize.getHeight();
	const logoData = await loadLogoDataUrl();

	let y = 126;
	drawHeader(doc, order, logoData);
	y = drawNameAddress(doc, order, y);
	y = drawItemsTable(doc, order, y) + 10;
	y = drawTotals(doc, order, y);
	y = drawWarranty(doc, y);
	y = ensureSpace(doc, y, 90, pageHeight);
	drawSignatures(doc, y);

	addReportFooter(doc);
	return doc;
}
