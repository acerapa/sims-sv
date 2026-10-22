import { addReportFooter, createReportDoc } from '$lib/utils/pdf';

/**
 * Flat, depth-annotated view of the category tree, ready for the PDF.
 * Rows are in the same DFS order the preview renders, so preview ≡ PDF.
 */
export interface CategoryRow {
	id: number;
	name: string;
	depth: number;
}

interface CategoryNode {
	id: number;
	name: string;
	sub_categories?: CategoryNode[];
}

/**
 * Flattens a grouped category tree (output of `groupedCategories`) into
 * depth-annotated rows: parent first, then each child recursively.
 * Pure and Svelte-free so it is testable from plain Node/vitest.
 */
export function buildCategoryRows(tree: CategoryNode[]): CategoryRow[] {
	const rows: CategoryRow[] = [];
	const walk = (node: CategoryNode, depth: number) => {
		rows.push({ id: node.id, name: node.name, depth });
		for (const child of node.sub_categories ?? []) walk(child, depth + 1);
	};
	for (const node of tree) walk(node, 0);
	return rows;
}

const LINE_HEIGHT = 16; // pt
// Per-level indent. The preview steps by 12px (CategoryItem); 14pt is the
// closest one-point step so the hierarchy reads the same in both.
const DEPTH_INDENT = 14;
// Bottom band left free on every page for the report footer
// (see addReportFooter's "keep ~45pt free" note).
const FOOTER_CLEARANCE = 50;

/**
 * Builds the "Product Categories" PDF as an indented list (no tables).
 * Layout decisions (user-confirmed): DFS order per the grouped tree,
 * `Total: N categories` trailing line, no item counts, no subtitle.
 */
export function buildCategoriesPdf(rows: CategoryRow[], total: number) {
	const { doc, margin, pageWidth, pageHeight, startY } = createReportDoc({
		title: 'Product Categories'
	});
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(10);

	let y = startY;

	const breakPage = () => {
		doc.addPage();
		y = 40;
	};

	const fits = () => y + LINE_HEIGHT <= pageHeight - FOOTER_CLEARANCE;

	const maxTextWidth = pageWidth - margin * 2;

	if (rows.length === 0) {
		doc.text('No categories found.', pageWidth / 2, y, { align: 'center' });
		addReportFooter(doc);
		return doc;
	}

	for (const row of rows) {
		const indent = row.depth * DEPTH_INDENT;
		const bullet = row.depth > 0 ? '• ' : '';
		const lines: string[] = doc.splitTextToSize(`${bullet}${row.name}`, maxTextWidth - indent);
		for (const line of lines) {
			if (!fits()) breakPage();
			doc.text(line, margin + indent, y);
			y += LINE_HEIGHT;
		}
		y += 4; // small gap between categories — hierarchy stays scannable
	}

	// Trailing total line, one blank line of separation from the list
	y += LINE_HEIGHT;
	if (!fits()) breakPage();
	doc.setFont('helvetica', 'bold');
	doc.text(`Total: ${total} categories`, margin, y);

	addReportFooter(doc);
	return doc;
}
