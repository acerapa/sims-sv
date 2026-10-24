import autoTable from 'jspdf-autotable';
import type { jsPDF } from 'jspdf';
import {
	addReportFooter,
	createReportDoc,
	ensureSpace,
	formatCurrencyPdf,
	formatDatePdf,
	tableFinalY
} from '$lib/utils/pdf';

const EMPTY_ITEMS_TEXT = 'No items in this package.';

export interface PackageItemRow {
	product_id: number;
	quantity: number | null;
	serial_number: string | null;
	price: string | number;
	total_price: string | number;
	product: {
		id: number;
		sku: string | null;
		sales_description: string | null;
	} | null;
}

export interface PackageDetailsData {
	id: number;
	name: string;
	description: string | null;
	total_price: string | number | null;
	created_at: Date | string;
	items: PackageItemRow[];
}

function drawInfoLine(
	doc: jsPDF,
	text: string,
	margin: number,
	y: number,
	pageWidth: number,
	pageHeight: number
): number {
	const lines: string[] = doc.splitTextToSize(text, pageWidth - margin * 2);
	y = ensureSpace(doc, y, lines.length * 12, pageHeight);
	for (const line of lines) {
		doc.text(line, margin, y + 10);
		y += 12;
	}
	return y;
}

function drawInfoBlock(
	doc: jsPDF,
	pkg: PackageDetailsData,
	margin: number,
	pageWidth: number,
	pageHeight: number,
	y: number
): number {
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(10);

	if (pkg.description) {
		y = drawInfoLine(doc, `Description: ${pkg.description}`, margin, y, pageWidth, pageHeight);
	}
	y = drawInfoLine(
		doc,
		`Created: ${formatDatePdf(pkg.created_at)}`,
		margin,
		y,
		pageWidth,
		pageHeight
	);
	return drawInfoLine(doc, `Items: ${pkg.items.length}`, margin, y, pageWidth, pageHeight);
}

function drawItemsTable(doc: jsPDF, items: PackageItemRow[], margin: number, y: number): number {
	autoTable(doc, {
		startY: y,
		margin: { left: margin, right: margin, top: 10, bottom: 48 },
		head: [['#', 'Description', 'SKU', 'Qty', 'Rate', 'S/N', 'Amount']],
		body:
			items.length > 0
				? items.map((item, index) => [
						String(index + 1),
						item.product?.sales_description || '',
						item.product?.sku || '',
						item.quantity == null ? '' : String(item.quantity),
						formatCurrencyPdf(item.price),
						item.serial_number || '',
						formatCurrencyPdf(item.total_price)
					])
				: [[{ content: EMPTY_ITEMS_TEXT, colSpan: 7, styles: { halign: 'center' } }]],
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
			0: { cellWidth: 20 },
			3: { halign: 'right', cellWidth: 35 },
			4: { halign: 'right', cellWidth: 65 },
			6: { halign: 'right', cellWidth: 70 }
		}
	});
	const finalY = tableFinalY(doc, y);
	return finalY + 8;
}

function drawTotalLine(
	doc: jsPDF,
	total: string | number | null,
	margin: number,
	pageWidth: number,
	y: number,
	pageHeight: number
): number {
	y = ensureSpace(doc, y, 20, pageHeight);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(10);
	doc.text(`Total: ${formatCurrencyPdf(total)}`, pageWidth - margin, y + 10, { align: 'right' });
	return y + 24;
}

export async function buildPackageDetailsPdf(pkg: PackageDetailsData): Promise<jsPDF> {
	const { doc, margin, pageWidth, pageHeight, startY } = await createReportDoc({
		title: `Package — ${pkg.name}`
	});

	let y = drawInfoBlock(doc, pkg, margin, pageWidth, pageHeight, startY);
	y = drawItemsTable(doc, pkg.items, margin, y);
	drawTotalLine(doc, pkg.total_price, margin, pageWidth, y, pageHeight);

	addReportFooter(doc);
	return doc;
}
