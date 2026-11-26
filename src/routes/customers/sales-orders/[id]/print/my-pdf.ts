import { loadLogoDataUrl } from '#lib/utils/pdf.ts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

async function buildHeader(doc: jsPDF) {
	const logoData = await loadLogoDataUrl();
	const LOGO_X = 16;
	const LOGO_Y = 16;
	const LOGO_SIZE = 50;
	const TEXT_X = 66;
	const GAP = 8; // space between lines

	// 4 lines total, so the block spans about 3 gaps (15mm)
	const startY = LOGO_Y + LOGO_SIZE / 2 - (GAP * 3) / 2 + 1;

	if (logoData) {
		doc.addImage(logoData, 'JPEG', LOGO_X, LOGO_Y, LOGO_SIZE, LOGO_SIZE);
	}

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(12);
	doc.text('RAM TECH VENTURES INC.', TEXT_X, startY);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8.5);
	doc.text('BARTOLOME BLDG., MAGSAYSAY ST. BLVD.', TEXT_X, startY + GAP);
	doc.text('BRGY. EAST AWANG POB.,', TEXT_X, startY + GAP * 2);
	doc.text('CALBAYOG CITY, SAMAR', TEXT_X, startY + GAP * 3);

	const pageWidth = doc.internal.pageSize.getWidth();

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(16);
	doc.text('D.R', pageWidth - 16, startY, { align: 'right' });

	doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
	const tableWidth = 120
  autoTable(doc, {
    tableWidth: tableWidth,
    startY: startY + GAP,
    margin: { left: pageWidth - tableWidth - 16 },
		theme: 'plain',
		head: [],
		body: [
			['DATE', 'S.O. NO.'],
			['', ''],
			['P.O. NO.', 'REP'],
			['', '']
		],
		styles: {
			lineWidth: 0.2,
			lineColor: [0, 0, 0],
      textColor: [0, 0, 0],
      fontSize: 8,
      fontStyle: 'bold',
      font: 'helvetica'
		}
	});
}

export async function buildDrPdf() {
	const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'legal' });
	doc.setFont('helvetica', 'normal');

	await buildHeader(doc);

	return doc;
}
