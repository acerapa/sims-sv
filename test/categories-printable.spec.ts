import { describe, expect, it } from 'vitest';
import { buildCategoriesPdf, buildCategoryRows } from '../src/routes/vendors/categories/print/pdf';
import type { jsPDF } from 'jspdf';

const TREE = [
	{
		id: 1,
		name: 'Beverages',
		sub_categories: [
			{ id: 3, name: 'Soft drinks', sub_categories: [{ id: 5, name: 'Carbonated' }] },
			{ id: 4, name: 'Juices' }
		]
	},
	{
		id: 2,
		name: 'Snacks',
		sub_categories: [{ id: 6, name: 'Chips' }]
	}
];

// jsPDF text entries can be plain strings (v2-style) or objects on newer builds.
const texts = (doc: jsPDF): (string | number)[] =>
	doc.getText().map((t: unknown) => (typeof t === 'string' ? t : (t as { text?: string }).text ?? t));

const rows = buildCategoryRows(TREE);

describe('buildCategoryRows', () => {
	it('flattens the tree in DFS order: parent before its children', () => {
		expect(rows.map((r) => r.id)).toEqual([1, 3, 5, 4, 2, 6]);
	});

	it('annotates depth: root 0, grandchildren 2', () => {
		expect(rows.map((r) => r.depth)).toEqual([0, 1, 2, 1, 0, 1]);
	});

	it('keeps children in their original (query) order', () => {
		const childrenOfBeverages = rows.filter((r) => r.depth === 1).map((r) => r.name);
		expect(childrenOfBeverages).toEqual(['Soft drinks', 'Juices']);
	});

	it('returns [] for an empty tree', () => {
		expect(buildCategoryRows([])).toEqual([]);
	});

	it('tolerates leaves without a sub_categories key', () => {
		const out = buildCategoryRows([{ id: 9, name: 'Solo' }]);
		expect(out).toEqual([{ id: 9, name: 'Solo', depth: 0 }]);
	});
});

describe('buildCategoriesPdf', () => {
	it('renders every category in DFS order', () => {
		const flat = texts(buildCategoriesPdf(rows, rows.length));
		const index = (name: string) => flat.findIndex((t) => String(t).includes(name));
		const order = ['Beverages', 'Soft drinks', 'Carbonated', 'Juices', 'Snacks', 'Chips']
			.map(index)
			.filter((i) => i !== -1);
		expect(order.length).toBe(6);
		expect([...order].sort((a, b) => a - b)).toEqual(order);
	});

	it('prefixes non-root lines with a bullet', () => {
		const flat = texts(buildCategoriesPdf(rows, rows.length)).map((t) => String(t));
		expect(flat.find((t) => t.includes('Soft drinks'))?.startsWith('• ')).toBe(true);
		expect(flat.find((t) => t.includes('Beverages'))?.startsWith('• ')).not.toBe(true);
	});

	it('ends with the approved "Total: N categories" line and no bullet on it', () => {
		const flat = texts(buildCategoriesPdf(rows, rows.length)).map((t) => String(t));
		const total = flat.find((t) => t.includes('Total: 6 categories'));
		expect(total).toBeDefined();
		expect(total?.startsWith('• ')).not.toBe(true);
	});

	it('renders the centered empty state and no total line', () => {
		const flat = texts(buildCategoriesPdf([], 0)).map((t) => String(t));
		expect(flat.some((t) => t.includes('No categories found.'))).toBe(true);
		expect(flat.some((t) => t.includes('Total:'))).toBe(false);
	});

	it('pages deep hierarchies: 200 categories spans more than one page', () => {
		const big = Array.from({ length: 200 }, (_, i) => ({ id: i + 1, name: `Category ${i + 1}`, depth: 0 }));
		const doc = buildCategoriesPdf(big, big.length);
		expect(doc.getNumberOfPages()).toBeGreaterThan(1);
		// footer runs on every page, so the generated-on line appears per page
		const flat = texts(doc);
		expect(flat.filter((t) => String(t).startsWith('Generated on')).length).toBe(
			doc.getNumberOfPages()
		);
	});
});
