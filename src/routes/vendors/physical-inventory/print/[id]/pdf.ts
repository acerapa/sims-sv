import autoTable from 'jspdf-autotable';
import type { jsPDF } from 'jspdf';
import {
	addReportFooter,
	capitalizeFirst,
	createReportDoc,
	drawField,
	drawNotes,
	ensureSpace,
	formatDatePdf
} from '$lib/utils/pdf';

export interface PhysicalInventoryItemRow {
	sku: string;
	purchase_description: string;
	category: string;
	system_count: string | number;
	actual_count: string | number;
	difference: string | number;
}

// Structural mirror of getInventoryById() in $lib/server/db/queries/physical-inventory.ts —
// declared locally (no $lib/server import) so this module runs in plain Node/vitest.
export interface PhysicalInventoryPrintData {
	id: number;
	title: string;
	status: string;
	date_finalized: string | Date | null;
	created_by: string | null;
	notes?: string | null;
	items: PhysicalInventoryItemRow[];
}

const toNumber = (value: string | number): number => {
	const parsed = parseFloat(String(value ?? '0')) || 0;
	return Number.isFinite(parsed) ? parsed : 0;
};

const signed = (value: string | number): string => {
	const n = toNumber(value);
	return n > 0 ? `+${n}` : String(n);
};

export async function buildPhysicalInventoryPdf(sheet: PhysicalInventoryPrintData): Promise<jsPDF> {
	const { doc, margin, pageWidth, pageHeight, startY } = await createReportDoc({
		title: 'Physical Inventory Sheet',
		subtitle: `PC-00${sheet.id} · ${capitalizeFirst(sheet.status || '')}`
	});
	const colWidth = (pageWidth - margin * 2) / 2;

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(12);
	doc.text(sheet.title || '—', margin, startY);
	const firstRowY = startY + 14;

	let y = drawField(doc, margin, colWidth, 'PREPARED BY', sheet.created_by || '—', firstRowY);
	drawField(
		doc,
		margin + colWidth,
		colWidth,
		'DATE FINALIZED',
		sheet.date_finalized ? formatDatePdf(sheet.date_finalized) : '—',
		firstRowY
	);

	y = ensureSpace(doc, y, 48, pageHeight);
	y = drawNotes(doc, sheet.notes ?? '', margin, y, pageWidth, pageHeight);

	const totals = sheet.items.reduce(
		(acc, item) => {
			acc.system += toNumber(item.system_count);
			acc.actual += toNumber(item.actual_count);
			acc.difference += toNumber(item.difference);
			return acc;
		},
		{ system: 0, actual: 0, difference: 0 }
	);

	const isDraft = (sheet.status || '').toLowerCase() === 'draft';

	autoTable(doc, {
		startY: y,
		margin: { left: margin, right: margin, top: 10, bottom: 48 },
		head: [['Item', 'SKU', 'Category', 'System Count', 'Actual Count', 'Difference']],
		body:
			sheet.items.length > 0
				? sheet.items.map((item) => [
						item.purchase_description,
						item.sku,
						item.category || '',
						String(item.system_count),
						isDraft ? '' : String(item.actual_count),
						isDraft ? '' : signed(item.difference)
					])
				: [
						[
							{
								content: 'No items on this inventory sheet.',
								colSpan: 6,
								styles: { halign: 'center' }
							}
						]
					],
		foot:
			sheet.items.length > 0
				? [
						[
							`Total (${sheet.items.length} items)`,
							'',
							'',
							String(totals.system),
							isDraft ? '' : String(totals.actual),
							isDraft ? '' : signed(totals.difference)
						]
					]
				: undefined,
		showHead: 'everyPage',
		showFoot: 'lastPage',
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
		footStyles: { fontStyle: 'bold' },
		columnStyles: {
			1: { cellWidth: 60 },
			2: { cellWidth: 60 },
			3: { halign: 'right', cellWidth: 60 },
			4: { halign: 'right', cellWidth: 60 },
			5: { halign: 'right', cellWidth: 60 }
		}
	});

	addReportFooter(doc);
	return doc;
}
