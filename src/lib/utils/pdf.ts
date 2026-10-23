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
	/** Logo override (base64/data-URL) — tests run in Node where fetch is unavailable (D4) */
	logoData?: string;
}

/**
 * Loads the company logo as a data-URL for the generated PDF.
 * Browser-only by design (plain-Node runs — tests, scripts — skip the logo,
 * see D4). A failed load degrades to the legacy logo-less header instead of
 * breaking PDF generation.
 */
export async function loadLogoDataUrl(): Promise<string | undefined> {
	if (typeof window === 'undefined') return undefined;
	try {
		const response = await fetch(LOGO_PATH);
		if (!response.ok) return undefined;
		const blob = await response.blob();
		const dataUrl = await new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () => reject(reader.error);
			reader.readAsDataURL(blob);
		});
		return dataUrl;
	} catch (error) {
		console.warn('Logo failed to load — printing without it', error);
		return undefined;
	}
}

export async function createReportDoc(options: ReportOptions): Promise<ReportDoc> {
	const doc = new jsPDF({
		orientation: options.orientation ?? 'portrait',
		unit: 'pt',
		format: 'letter'
	});
	const margin = REPORT_MARGIN;
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();

	// Logo on the left, company info shifted right of it (D2/D3). The shift only
	// happens when the logo actually draws, so a failed load leaves the
	// legacy layout intact — no empty gap.
	const logoData = options.logoData ?? (await loadLogoDataUrl());
	let infoX = margin;
	if (logoData) {
		try {
			doc.addImage(logoData, 'JPEG', margin, 32, LOGO_SIZE, LOGO_SIZE);
			infoX = margin + LOGO_SIZE + LOGO_GAP;
		} catch (error) {
			console.warn('Logo failed to render — printing without it', error);
		}
	}

	// Company name in a box (mirrors .company-name)
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(14);
	const companyName = 'RAM TECH VENTURES INC.';
	doc.text(companyName, infoX, 48);
	doc.setDrawColor(0, 0, 0);
	doc.setLineWidth(2);
	doc.rect(infoX - 8, 32, doc.getTextWidth(companyName) + 16, 24);

	// Address lines
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8);
	doc.text('BARTOLOME BLDG. MAGSAYSAY ST.', infoX, 70);
	doc.text('BRGY. EAST AWANG', infoX, 80);
	doc.text('CALBAYOG, PA 6710', infoX, 90);

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

// ── Shared helpers for the per-report print/pdf.ts builders ─────────────────
// Each report keeps its own table-drawing code; the small formatters and
// pagination helpers below were copy-pasted across routes and are consolidated
// here (see ai-docs/pdf-shared-helpers-spec.md).

export const PDF_FOOTER_BAND = 48; // bottom band kept free for addReportFooter

// Logo header constants (D2): 64px on screen × 0.75 = 48pt on paper.
export const LOGO_PATH = '/ramtech-logo.jpg';
export const LOGO_SIZE = 48; // pt, square asset
export const LOGO_GAP = 12; // pt between logo and company info
export const PDF_LABEL_COLOR: [number, number, number] = [102, 102, 102]; // #666 muted labels

/** Standard PDF fonts have no ₱ glyph, so money renders as "Php …". */
export function formatCurrencyPdf(value: string | number | null | undefined): string {
	const num = typeof value === 'string' ? parseFloat(value || '0') : (value ?? 0);
	return `Php ${num.toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})}`;
}

/** Coerces a DB amount (string or number) to a finite number, NaN/null → 0. */
export function safeNum(value: unknown): number {
	const n = typeof value === 'string' ? parseFloat(value) : Number(value as number);
	return Number.isFinite(n) ? n : 0;
}

// 'en-US' (not 'default') so the rendered date doesn't depend on the
// server/browser locale (decision D1, ai-docs/pdf-shared-helpers-spec.md)
export function formatDatePdf(value: Date | string | number | null | undefined): string {
	if (value == null || value === '') return '';
	return new Date(value).toLocaleDateString('en-US', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}

/** Mirrors PrintReportLayout's .date-range label, including the "All Dates" fallback. */
export function dateRangeLabel(filters?: { from?: string | null; to?: string | null }): string {
	const from = filters?.from || null;
	const to = filters?.to || null;
	if (from && to) return `${formatDatePdf(from)} — ${formatDatePdf(to)}`;
	if (from) return `From ${formatDatePdf(from)}`;
	if (to) return `Up to ${formatDatePdf(to)}`;
	return 'All Dates';
}

/**
 * Capitalizes the first letter of each whitespace-separated word, preserving
 * interior case — mirrors CSS text-transform: capitalize (decision D2).
 */
export function titleCase(value: string): string {
	return value
		.split(' ')
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

export function capitalizeFirst(value: string): string {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Y coordinate where the last jspdf-autotable call ended (or `fallback`). */
export function tableFinalY(doc: jsPDF, fallback: number): number {
	return (
		(doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? fallback
	);
}

/** Page-breaks when the next draw would cross the footer band; returns the new Y. */
export function ensureSpace(doc: jsPDF, y: number, needed: number, pageHeight: number): number {
	if (y + needed > pageHeight - PDF_FOOTER_BAND) {
		doc.addPage();
		return PDF_FOOTER_BAND;
	}
	return y;
}

/** Draws a `LABEL` over a value with a muted underline (mirrors the preview's bordered fields). */
export function drawField(
	doc: jsPDF,
	x: number,
	width: number,
	label: string,
	value: string,
	y: number
): number {
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(7);
	doc.setTextColor(...PDF_LABEL_COLOR);
	doc.text(label, x, y);
	doc.setTextColor(0, 0, 0);
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(10);
	doc.text(value, x, y + 12);
	doc.setDrawColor(153, 153, 153);
	doc.setLineWidth(0.5);
	doc.line(x, y + 16, x + width, y + 16);
	doc.setDrawColor(0, 0, 0);
	return y + 26;
}

export function drawNotesLine(
	doc: jsPDF,
	line: string,
	margin: number,
	y: number,
	pageHeight: number
): number {
	if (y + 12 > pageHeight - PDF_FOOTER_BAND) {
		doc.addPage();
		y = PDF_FOOTER_BAND;
	}
	doc.text(line, margin, y);
	return y + 12;
}

export function drawNotes(
	doc: jsPDF,
	notes: string,
	margin: number,
	y: number,
	pageWidth: number,
	pageHeight: number
): number {
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(7);
	doc.setTextColor(...PDF_LABEL_COLOR);
	doc.text('NOTES', margin, y);
	doc.setTextColor(0, 0, 0);
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(10);
	// falsy → '---', matching the preview's truthy check
	const lines: string[] = doc.splitTextToSize(notes || '---', pageWidth - margin * 2);
	y += 12;
	for (const line of lines) {
		// uncapped free text — paginate explicitly rather than rely on jsPDF's auto-paging
		y = drawNotesLine(doc, line, margin, y, pageHeight);
	}
	return y + 8;
}
