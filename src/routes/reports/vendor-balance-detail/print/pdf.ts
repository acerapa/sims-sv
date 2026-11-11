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
} from '#lib/utils/pdf.ts';
import type { VbdVendorLedger } from '#lib/utils/vendor-balance.ts';

export interface VendorBalancePdfData {
	ledgers: VbdVendorLedger[];
}

const EMPTY_RANGE_TEXT = 'No bills found for the selected range.';

const HEAD_ROW = ['Type', 'Date', 'Num', 'Memo', 'Amount', 'Balance'];
const ROW_HEIGHT = 16;
const SECTION_GAP = 24;

/** Estimated table height for the page-break math. */
function tableHeight(vendor: VbdVendorLedger): number {
	const rowCount = vendor.rows.length + (vendor.opening_balance !== 0 ? 1 : 0) + 1; // + foot
	return 24 + rowCount * ROW_HEIGHT;
}

function drawVendorSection(
	doc: jsPDF,
	vendor: VbdVendorLedger,
	margin: number,
	pageHeight: number,
	y: number
): number {
	let cursor = ensureSpace(doc, y, Math.min(tableHeight(vendor), pageHeight - 100), pageHeight);

	// bold vendor heading — the preview's <h3 class="print-section-title">
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(12);
	doc.text(vendor.supplier_name, margin, cursor + 14);
	cursor += SECTION_GAP;

	const body: (string | number)[][] = [];
	if (vendor.opening_balance !== 0) {
		body.push(['Opening Balance', '', '', '', '', formatCurrencyPdf(vendor.opening_balance)]);
	}
	for (const row of vendor.rows) {
		body.push([
			row.type,
			formatDatePdf(row.date),
			row.num,
			row.memo,
			formatCurrencyPdf(row.amount),
			formatCurrencyPdf(row.balance)
		]);
	}

	autoTable(doc, {
		startY: cursor,
		margin: { left: margin, right: margin, top: 10, bottom: 48 },
		head: [HEAD_ROW],
		body,
		foot: [
			[
				{ content: `Total ${vendor.supplier_name}`, colSpan: 4 },
				formatCurrencyPdf(vendor.total_amount),
				formatCurrencyPdf(vendor.ending_balance)
			]
		],
		theme: 'plain',
		styles: {
			font: 'helvetica',
			fontSize: 9,
			cellPadding: 3,
			lineWidth: 0,
			textColor: [17, 17, 17]
		},
		headStyles: {
			fontStyle: 'bold',
			cellPadding: 4,
			lineColor: 0,
			lineWidth: 0.5,
			textColor: [17, 17, 17]
		},
		footStyles: {
			fontStyle: 'bold',
			cellPadding: 4,
			lineColor: 0,
			lineWidth: 0.5,
			textColor: [17, 17, 17]
		},
		// accounting rules: header underline + a band around the vendor total
		didDrawCell: (data) => {
			const { x, y, width, height } = data.cell;
			if (data.section === 'head') {
				doc.setDrawColor(0);
				doc.setLineWidth(0.5);
				doc.line(x, y + height, x + width, y + height);
			}
			if (data.section === 'foot' && data.row.index === 0) {
				doc.setDrawColor(0);
				doc.setLineWidth(0.5);
				doc.line(x, y, x + width, y);
				doc.line(x, y + height, x + width, y + height);
			}
		},
		columnStyles: {
			0: { cellWidth: 90 },
			1: { cellWidth: 70 },
			2: { cellWidth: 70 },
			4: { halign: 'right', cellWidth: 90 },
			5: { halign: 'right', cellWidth: 90 }
		}
	});

	return tableFinalY(doc, cursor) + 8;
}

export async function buildVendorBalancePdf(
	data: VendorBalancePdfData,
	filters?: { from?: string | null; to?: string | null }
): Promise<jsPDF> {
	const { doc, margin, pageWidth, pageHeight, startY } = await createReportDoc({
		title: 'Vendor Balance Detail',
		subtitle: dateRangeLabel(filters)
	});

	if (data.ledgers.length === 0) {
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(10);
		doc.setTextColor(102, 102, 102);
		doc.text(EMPTY_RANGE_TEXT, 50, ensureSpace(doc, startY, 40, pageHeight) + 20, {
			align: 'center'
		});
		doc.setTextColor(0, 0, 0);
	} else {
		let cursor = startY;
		for (const vendor of data.ledgers) {
			cursor = drawVendorSection(doc, vendor, margin, pageHeight, cursor);
		}

		// bold "TOTAL ALL VENDORS" grand line — the preview's final subtotal line
		cursor = ensureSpace(doc, cursor, 20, pageHeight);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(10);
		const grandTotal = data.ledgers.reduce(
			(acc, v) => acc + Math.round(v.ending_balance * 100) / 100,
			0
		);
		doc.text(
			`TOTAL ALL VENDORS: ${formatCurrencyPdf(grandTotal)}`,
			pageWidth - margin,
			cursor + 12,
			{
				align: 'right'
			}
		);
		cursor += 24;
	}

	addReportFooter(doc);
	return doc;
}
