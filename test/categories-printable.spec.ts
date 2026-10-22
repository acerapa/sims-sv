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

// jsPDF 4 removed doc.getText(); the raw PDF content stream still holds the
// standard-font text in literal `(...) Tj` operators, so we parse those.
const textItems = (doc: jsPDF): string[] => {
	const raw = doc.output() as string;
	const items: string[] = [];
	const re = /\(((?:\\.|[^()\\])*)\)\s*Tj/g;
	for (const m of raw.matchAll(re)) items.push(m[1]);
	return items;
};

const rows = buildCategoryRows(TREE);

describe('buildCategoryRows', () => {
	it('flattens the tree in DFS order: parent before its children', () => {
		expect(rows.map((r) => r.id)).toEqual([1, 3, 5, 4, 2, 6]);
	});

	it('annotates depth: root 0, grandchildren 2', () => {
		expect(rows.map((r) => r.depth)).toEqual([0, 1, 2, 1, 0, 1]);
	});

	it('keeps every level in query (id) order', () => {
		const level1 = rows.filter((r) => r.depth === 1).map((r) => r.id);
		expect(level1).toEqual([3, 4, 6]); // id DESC query order preserved
		const level0 = rows.filter((r) => r.depth === 0).map((r) => r.id);
		expect(level0).toEqual([1, 2]);
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
		const flat = textItems(buildCategoriesPdf(rows, rows.length));
		const index = (name: string) => flat.findIndex((t) => t.endsWith(name));
		const order = ['Beverages', 'Soft drinks', 'Carbonated', 'Juices', 'Snacks', 'Chips']
			.map(index)
			.filter((i) => i !== -1);
		expect(order.length).toBe(6);
		expect([...order].sort((a, b) => a - b)).toEqual(order);
	});

	it('prefixes non-root lines with a bullet', () => {
		const flat = textItems(buildCategoriesPdf(rows, rows.length));
		const root = flat.find((t) => t.endsWith('Beverages'));
		const child = flat.find((t) => t.endsWith('Soft drinks'));
		expect(root).toBeDefined();
		expect(child).toBeDefined();
		expect(root).toBe('Beverages'); // root: plain name
		expect(child && child.length > 'Soft drinks'.length).toBe(true); // child: bullet prefix + name
	});

	it('ends with the approved "Total: N categories" line, unprefixed', () => {
		const flat = textItems(buildCategoriesPdf(rows, rows.length));
		expect(flat).toContain('Total: 6 categories');
	});

	it('renders the centered empty state and no total line', () => {
		const flat = textItems(buildCategoriesPdf([], 0));
		expect(flat).toContain('No categories found.');
		expect(flat.some((t) => t.includes('Total:'))).toBe(false);
	});

	it('pages deep hierarchies: 200 categories spans more than one page', () => {
		const big = Array.from({ length: 200 }, (_, i) => ({ id: i + 1, name: `Category ${i + 1}`, depth: 0 }));
		const doc = buildCategoriesPdf(big, big.length);
		expect(doc.getNumberOfPages()).toBeGreaterThan(1);
		// footer runs on every page, so the generated-on line appears per page
		const flat = textItems(doc);
		const footers = flat.filter((t) => t.startsWith('Generated on'));
		expect(footers.length).toBeGreaterThanOrEqual(doc.getNumberOfPages());
		expect(flat).toContain(`Total: ${big.length} categories`);
	});
});
