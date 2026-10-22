import autoTable, { type CellInput, type Styles } from 'jspdf-autotable';
import { jsPDF } from 'jspdf';
import { addReportFooter } from '$lib/utils/pdf';

// Standard jsPDF fonts have no ₱ glyph, so money renders as "Php" (same as other print routes)
function formatCurrencyPdf(value: number | string | null | undefined): string {
	const num = typeof value === 'string' ? parseFloat(value || '0') : (value ?? 0);
	return `Php ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type Amount = number | string | null | undefined;

// Structural twins of getSalesOrder / getDailySalesPayment (declared locally — no $lib/server import)
export interface ReceiptItem {
	id: number;
	quantity: number;
	unit_price: Amount;
	total_price: Amount;
	serial_number?: string | null;
	product?: { sales_description?: string | null } | null;
	package?: { name?: string | null } | null;
}

export interface SalesReceiptOrder {
	id: number;
	date_ordered: Date | string;
	total_cost: Amount;
	discount?: Amount;
	customer?: { name?: string | null; address?: string | null } | null;
	staff?: { name?: string | null } | null;
	items?: ReceiptItem[];
}

export interface SalesReceiptPayment {
	check_number?: string | null;
	payment_type?: string | null;
}

function titleCase(value: string): string {
	return value
		.split(' ')
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

const BASE_STYLES: Partial<Styles> = {
	font: 'helvetica',
	fontSize: 8,
	cellPadding: 4,
	lineColor: 0,
	lineWidth: 0.5,
	textColor: [17, 17, 17]
};

// mirrors the preview's plain-weight, centered items-table heads
const HEAD_STYLES: Partial<Styles> = {
	font: 'helvetica',
	fontSize: 8,
	fontStyle: 'normal',
	textColor: [17, 17, 17],
	halign: 'center'
};

const DATA_ROW_HEIGHT = 23; // 8mm, the preview's items-table row height
const BLANK_ROW_HEIGHT = 37; // 13mm

const MIN_ITEM_ROWS = 8; // the preview pads Math.max(0, 8 - items.length) blank rows

function formCell(value: string | number, minCellHeight: number): CellInput {
	return { content: value, styles: { minCellHeight } };
}

function drawHeader(doc: jsPDF, order: SalesReceiptOrder, margin: number, pageWidth: number): void {
	// Company block (left) — the receipt's own address text (spec Q3), helvetica per Q5
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(13);
	const companyName = 'RAM TECH VENTURES INC.';
	doc.text(companyName, margin, 52);
	doc.setDrawColor(0, 0, 0);
	doc.setLineWidth(1);
	doc.rect(margin - 5, 38, doc.getTextWidth(companyName) + 10, 20);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(7.5);
	doc.text('BARTOLOME BLDG. MAGSAYSAY BLVD.', margin, 76);
	doc.text('BRGY. EAST AWANG POB.', margin, 85);
	doc.text('CALBAYOG CITY, SAMAR', margin, 94);

	// Title + reference table (right)
	const halfCenter = pageWidth / 2;
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(12);
	doc.text('SALES-DELIVERY RECEIPT', halfCenter, 52, { align: 'center' });

	const dateOrdered = new Date(order.date_ordered).toLocaleDateString('default');
	const tableX = halfCenter + 43;
	const tableW = 114;
	const headH = 16;
	const valueH = 15;
	const colW = tableW / 2;
	doc.setDrawColor(0, 0, 0);
	doc.setLineWidth(0.5);
	doc.rect(tableX, 68, tableW, headH + valueH);
	doc.line(tableX + colW, 68, tableX + colW, 68 + headH + valueH);
	doc.line(tableX, 68 + headH, tableX + tableW, 68 + headH);
	doc.setFontSize(7.5);
	doc.text('Date', tableX + colW / 2, 78, { align: 'center' });
	doc.text('Sale No.', tableX + colW * 1.5, 78, { align: 'center' });
	doc.text(dateOrdered, tableX + colW / 2, 92, { align: 'center' });
	doc.text(String(order.id), tableX + colW * 1.5, 92, { align: 'center' });
}

function drawSoldTo(doc: jsPDF, order: SalesReceiptOrder, margin: number, y: number): number {
	const boxW = 255; // 48% of the printable width
	const boxH = 99; // 35mm
	doc.setDrawColor(0, 0, 0);
	doc.setLineWidth(1);
	doc.rect(margin, y, boxW, boxH);
	const titleH = 22; // 8mm
	doc.line(margin, y + titleH, margin + boxW, y + titleH);
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(9);
	doc.text('Sold To', margin + 6, y + 14);

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(10);
	doc.text((order.customer?.name || '—').toUpperCase(), margin + 6, y + titleH + 14);
	if (order.customer?.address) {
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(8);
		doc
			.splitTextToSize(order.customer.address.toUpperCase(), boxW - 12)
			.forEach((line: string, i: number) => {
				doc.text(line, margin + 6, y + titleH + 28 + i * 11);
			});
	}
	return y + boxH + 28; // 10mm gap, like the preview's .sold-to margin-bottom
}

function drawPaymentGrid(
	doc: jsPDF,
	order: SalesReceiptOrder,
	payment: SalesReceiptPayment | null,
	y: number
): number {
	const gridW = 303; // 57% of the printable width
	const colW = gridW / 4;
	const gridX = 612 - 40 - gridW;
	const labels = ['Check No.', 'Payment Method', 'Rep', 'Project'];
	const values = [
		payment?.check_number || '',
		payment?.payment_type ? titleCase(payment.payment_type.replaceAll('_', ' ')) : '—',
		order.staff?.name || '',
		''
	];
	const headH = 16;
	const valueH = 28; // 10mm
	doc.setDrawColor(0, 0, 0);
	doc.setLineWidth(0.5);
	labels.forEach((label, i) => {
		doc.rect(gridX + i * colW, y, colW, headH);
		doc.rect(gridX + i * colW, y + headH, colW, valueH);
	});
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(7.5);
	labels.forEach((label, i) =>
		doc.text(label, gridX + (i + 0.5) * colW, y + 10.5, { align: 'center' })
	);
	doc.setFontSize(8);
	doc.setTextColor(0, 0, 0);
	values.forEach((value, i) =>
		doc.text(String(value).slice(0, 40), gridX + (i + 0.5) * colW, y + headH + 13, {
			align: 'center'
		})
	);
	return y + headH + valueH + 10;
}

function drawItemsTable(doc: jsPDF, order: SalesReceiptOrder, y: number): number {
	const items = order.items ?? [];
	const blankRows = Math.max(0, MIN_ITEM_ROWS - items.length);
	const rows: CellInput[][] = [
		...items.map((item) => {
			const name = item.package?.name || item.product?.sales_description || '—';
			const minH = DATA_ROW_HEIGHT;
			return [
				formCell(name, minH),
				formCell(item.quantity, minH),
				formCell(formatCurrencyPdf(item.unit_price), minH),
				formCell(item.serial_number || '', minH),
				formCell(formatCurrencyPdf(item.total_price), minH)
			];
		}),
		...Array.from({ length: blankRows }, () =>
			Array.from({ length: 5 }, () => formCell('', BLANK_ROW_HEIGHT))
		)
	];

	autoTable(doc, {
		startY: y,
		margin: { left: 40, right: 40, top: 6, bottom: 48 },
		head: [['Item', 'Qty', 'Rate', 'S/N', 'Amount']],
		body: rows,
		theme: 'grid',
		styles: BASE_STYLES,
		headStyles: HEAD_STYLES,
		columnStyles: {
			// the preview's 55 / 7 / 10 / 16 / 12 % column ratios over the printable width
			0: { cellWidth: 292.6 },
			1: { cellWidth: 37.2, halign: 'right' },
			2: { cellWidth: 53.2, halign: 'right' },
			3: { cellWidth: 85.1 },
			4: { cellWidth: 63.8, halign: 'right' }
		}
	});
	return (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
}

function drawTotals(doc: jsPDF, order: SalesReceiptOrder, y: number): number {
	const boxW = 213; // 40% of the printable width
	const boxX = 612 - 40 - boxW;
	const subtotal = (order.items ?? []).reduce((sum, item) => {
		const n =
			typeof item.total_price === 'string'
				? parseFloat(item.total_price || '0')
				: (item.total_price ?? 0);
		return sum + (Number.isFinite(n) ? n : 0);
	}, 0);
	const discount =
		typeof order.discount === 'string' ? parseFloat(order.discount || '0') : (order.discount ?? 0);
	const total =
		typeof order.total_cost === 'string'
			? parseFloat(order.total_cost || '0')
			: (order.total_cost ?? 0);
	const hasDiscount = Number.isFinite(discount) && discount > 0;

	const rowH = 19; // 3mm padding + 8pt text
	const rows: Array<[string, string]> = [['Subtotal', formatCurrencyPdf(subtotal)]];
	if (hasDiscount) {
		rows.push(['Discount', `-${formatCurrencyPdf(discount)}`]);
	}
	doc.setDrawColor(0, 0, 0);
	doc.setLineWidth(1);
	rows.forEach(([label, value], i) => {
		doc.rect(boxX, y + i * rowH, boxW, rowH);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(9);
		doc.text(label, boxX + 6, y + i * rowH + 13);
		doc.setFont('helvetica', 'normal');
		doc.text(value, boxX + boxW - 6, y + i * rowH + 13, { align: 'right' });
	});
	const bottom = y + rows.length * rowH;

	// ruled grand total (the preview prints order.total_cost — not computed)
	doc.rect(boxX, bottom, boxW, 24);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(11);
	doc.text('Total', boxX + 6, bottom + 16);
	doc.text(formatCurrencyPdf(total), boxX + boxW - 6, bottom + 16, { align: 'right' });
	return bottom + 24 + 28; // 10mm gap before the signature box
}

function drawSignature(doc: jsPDF, margin: number, y: number): void {
	doc.setDrawColor(0, 0, 0);
	doc.setLineWidth(1);
	doc.rect(margin, y, 255, 30);
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(9);
	doc.text('SIGNATURE OVER PRINTED NAME', margin + 6, y + 19);
}

export function buildSalesReceiptPdf(
	order: SalesReceiptOrder,
	payment: SalesReceiptPayment | null
): jsPDF {
	// No createReportDoc on purpose: the receipt has its own header anatomy (boxed company
	// name + address + SALES-DELIVERY RECEIPT reference table) — spec Q1 option A.
	const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
	const margin = 40;
	const PAGE_H = 792;
	const FOOTER_RESERVE = 48;
	let y = 110;

	// long receipts (many items) flow to the next page, like the old browser print
	const ensureRoom = (needed: number) => {
		if (y + needed > PAGE_H - FOOTER_RESERVE) {
			doc.addPage();
			y = margin;
		}
	};

	drawHeader(doc, order, margin, doc.internal.pageSize.getWidth());
	y = drawSoldTo(doc, order, margin, y);
	ensureRoom(44);
	y = drawPaymentGrid(doc, order, payment, y);
	y = drawItemsTable(doc, order, y) + 10;
	ensureRoom(90); // totals block (2–3 ruled rows + ruled total)
	y = drawTotals(doc, order, y);
	ensureRoom(30); // signature box
	drawSignature(doc, margin, y);

	addReportFooter(doc);
	return doc;
}
