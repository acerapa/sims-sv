import { jsPDF } from 'jspdf';

/**
 * Shared PDF report scaffolding that mirrors PrintReportLayout.svelte:
 * company header, ruled report title, and a "Generated on…" footer with
 * page numbers on every page.
 *
 * Keep this file free of $lib imports so it can also be exercised from
 * plain Node scripts.
 */

export const REPORT_MARGIN = 40; // pt

export interface ReportDoc {
	doc: jsPDF;
	margin: number;
	pageWidth: number;
	pageHeight: number;
	/** Y coordinate where report content (e.g. the first table) should start */
	startY: number;
}

/**
 * Opens the generated PDF in a new tab with the auto-print action set,
 * so the browser's print dialog opens directly (replaces window.print()).
 */
export function openAndPrint(doc: jsPDF): void {
	doc.autoPrint();
	window.open(doc.output('bloburi'), '_blank');
}

export interface ReportOptions {
	title: string;
	/** Optional label shown right-aligned next to the title (e.g. a date range) */
	subtitle?: string;
	/** Orientation for all pages; defaults to portrait */
	orientation?: 'portrait' | 'landscape';
}

export function createReportDoc(options: ReportOptions): ReportDoc {
	const doc = new jsPDF({
		orientation: options.orientation ?? 'portrait',
		unit: 'pt',
		format: 'letter'
	});
	const margin = REPORT_MARGIN;
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();

	// Company name in a box (mirrors .company-name)
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(14);
	const companyName = 'RAM TECH VENTURES INC.';
	doc.text(companyName, margin, 48);
	doc.setDrawColor(0, 0, 0);
	doc.setLineWidth(2);
	doc.rect(margin - 8, 32, doc.getTextWidth(companyName) + 16, 24);

	// Address lines
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8);
	doc.text('BARTOLOME BLDG. MAGSAYSAY ST.', margin, 70);
	doc.text('BRGY. EAST AWANG', margin, 80);
	doc.text('CALBAYOG, PA 6710', margin, 90);

	// Title section between two rules (mirrors .report-title-section)
	doc.setLineWidth(1);
	doc.line(margin, 108, pageWidth - margin, 108);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(12);
	doc.text(options.title, margin, 126);
	if (options.subtitle) {
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(8);
		doc.setTextColor(51, 51, 51); // #333 — ≥4.5:1 contrast on white
		doc.text(options.subtitle, pageWidth - margin, 126, { align: 'right' });
		doc.setTextColor(0, 0, 0);
	}
	doc.line(margin, 134, pageWidth - margin, 134);

	return { doc, margin, pageWidth, pageHeight, startY: 148 };
}

/**
 * Adds the "Generated on…" footer with page numbers to every page.
 * Call this after all content has been drawn. Keep at least ~45pt of
 * bottom space free on each page (e.g. autoTable margin.bottom).
 */
export function addReportFooter(doc: jsPDF, margin = REPORT_MARGIN): void {
	const pageCount = doc.getNumberOfPages();
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const generatedOn = new Date().toLocaleString('default', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	for (let i = 1; i <= pageCount; i++) {
		doc.setPage(i);
		doc.setDrawColor(204, 204, 204);
		doc.setLineWidth(1);
		doc.line(margin, pageHeight - 32, pageWidth - margin, pageHeight - 32);
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(8);
		doc.setTextColor(51, 51, 51); // #333 — ≥4.5:1 contrast on white
		doc.text(`Generated on ${generatedOn}`, pageWidth - margin, pageHeight - 20, {
			align: 'right'
		});
		doc.text(`Page ${i} of ${pageCount}`, margin, pageHeight - 20);
		doc.setTextColor(0, 0, 0);
	}
}
