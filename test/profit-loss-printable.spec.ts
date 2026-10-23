import { describe, expect, it } from 'vitest';
import {
	buildProfitLossPdf,
	formatCurrency,
	formatMonth,
	grossMarginPercent,
	type ProfitLossData
} from '../src/routes/reports/profit-loss/print/pdf';
import { formatCurrencyPdf } from '../src/lib/utils/pdf';

// jsPDF 4 removed getText()/getTextContent() — pull rendered strings out of the raw
// content stream (same approach as test/categories-printable.spec.ts).
function textIn(doc: { output: () => string }): string {
	const content = doc.output('arraybuffer') as ArrayBuffer;
	const text = new TextDecoder('latin1').decode(new Uint8Array(content));
	const parts: string[] = [];
	const re = /\(((?:\\.|[^()\\])*)\)\s*Tj/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(text))) parts.push(m[1]);
	return parts.join('\n');
}

let productId = 0;
function monthly(month: string, income: string, cogs: string, gross: string) {
	return { month, income, cogs, gross_profit: gross };
}

// three months — includes a zero-income month (margin must be 0.0%)
const range: ProfitLossData = {
	summary: { total_income: '4000.50', total_cogs: '3400.50', gross_profit: '600.00' },
	monthly: [
		monthly('2026-05', '1200.00', '900.00', '300.00'),
		monthly('2026-06', '2800.50', '2500.50', '300.00'),
		monthly('2026-07', '0', '0', '0')
	],
	detail: [
		{
			product_id: ++productId,
			product_sku: 'SKU-001',
			product_name: 'Wireless Mouse',
			quantity_sold: 3,
			total_revenue: '900.00',
			total_cost: '600.00',
			profit: '300.00'
		},
		{
			product_id: ++productId,
			product_sku: 'SKU-002',
			product_name: 'USB Cable',
			quantity_sold: 10,
			total_revenue: '250.00',
			total_cost: '180.00',
			profit: '70.00'
		}
	]
};

const oneMonth: ProfitLossData = {
	summary: { total_income: '500.00', total_cogs: '200.00', gross_profit: '300.00' },
	monthly: [monthly('2026-07', '500.00', '200.00', '300.00')],
	detail: []
};

const wide: ProfitLossData = {
	summary: { total_income: '0', total_cogs: '0', gross_profit: '0' },
	monthly: Array.from({ length: 12 }, (_, i) =>
		monthly(`2026-${String(i + 1).padStart(2, '0')}`, '100.00', '50.00', '50.00')
	),
	detail: []
};

const nineMonths: ProfitLossData = {
	...range,
	monthly: range.monthly.concat(wide.monthly.slice(0, 6))
};
const eightMonths: ProfitLossData = {
	...range,
	monthly: range.monthly.concat(wide.monthly.slice(0, 5))
};
const empty: ProfitLossData = {
	summary: { total_income: '0', total_cogs: '0', gross_profit: '0' },
	monthly: [],
	detail: []
};

const filters = { from: '2026-05-01', to: '2026-07-31' };
const portraitWidth = 612; // letter
const landscapeWidth = 792;

describe('shared formatters (preview + PDF single source)', () => {
	it('formatCurrency keeps the ₱ glyph and 2-decimal rounding', () => {
		expect(formatCurrency('1234.5')).toBe('₱1,234.50');
		expect(formatCurrency('99.999')).toBe('₱100.00');
	});

	it('formatCurrencyPdf renders Php, parses string numerics, null → 0.00', () => {
		expect(formatCurrencyPdf('1234.5')).toBe('Php 1,234.50');
		expect(formatCurrencyPdf(null)).toBe('Php 0.00');
		expect(formatCurrencyPdf(undefined)).toBe('Php 0.00');
	});

	it('formatMonth renders "Month YYYY"', () => {
		expect(formatMonth('2026-07')).toBe('July 2026');
		expect(formatMonth('2026-01')).toBe('January 2026');
	});

	it('grossMarginPercent is one decimal, 0.0 when income is 0', () => {
		expect(grossMarginPercent(800, 200)).toBe('25.0');
		expect(grossMarginPercent(0, 500)).toBe('0.0');
		expect(grossMarginPercent(4000.5, 900)).toBe('22.5');
	});
});

describe('buildProfitLossPdf — summary view', () => {
	it('single month: no Total column, portrait, monthly + Overall Totals values', () => {
		const doc = buildProfitLossPdf(oneMonth, 'summary', filters);
		const lines = textIn(doc).split('\n');
		expect(lines).toContain('Profit & Loss — Summary');
		expect(lines).toContain('July 2026');
		expect(lines).not.toContain('Total'); // no Total column with 1 month
		expect(lines).toContain('Php 500.00');
		expect(lines).toContain('60.0%'); // 300 / 500
		expect(doc.internal.pageSize.getWidth()).toBe(portraitWidth);
	});

	it('three months: month headers, Total column with reduced totals, per-month margins', () => {
		const lines = textIn(buildProfitLossPdf(range, 'summary', filters)).split('\n');
		expect(lines).toContain('May 2026');
		expect(lines).toContain('June 2026');
		expect(lines).toContain('July 2026');
		expect(lines).toContain('Total');
		expect(lines).toContain('Php 4,000.50'); // income total
		expect(lines).toContain('Php 3,400.50'); // cogs total
		expect(lines).toContain('Php 600.00'); // gross total
		expect(lines).toContain('25.0%'); // month 1: 300 / 1200
		expect(lines).toContain('0.0%'); // zero-income month
	});

	it('zero-income month renders margin 0.0%, never NaN', () => {
		const text = textIn(buildProfitLossPdf(range, 'summary', filters));
		expect(text).not.toContain('NaN');
		expect(text).toContain('0.0%');
	});

	it('empty monthly: empty-state row, no Income/COGS rows or tfoot', () => {
		const lines = textIn(buildProfitLossPdf(empty, 'summary', filters)).split('\n');
		expect(lines.some((l) => l.includes('No invoice data found'))).toBe(true);
		expect(lines.some((l) => l.includes('the selected date range'))).toBe(true);
		expect(lines).not.toContain('Income');
		expect(lines).not.toContain('Cost of Goods Sold');
		expect(lines).not.toContain('Gross Profit');
		expect(lines).not.toContain('Gross Margin %');
	});
});

describe('buildProfitLossPdf — orientation decision (user: landscape for wide ranges)', () => {
	it('≤ 8 month columns stay portrait', () => {
		const doc = buildProfitLossPdf(eightMonths, 'summary', filters);
		expect(doc.internal.pageSize.getWidth()).toBe(portraitWidth);
	});

	it('more than 8 month columns flip to landscape (whole document)', () => {
		const doc = buildProfitLossPdf(nineMonths, 'summary', filters);
		expect(doc.internal.pageSize.getWidth()).toBe(landscapeWidth);
	});

	it('12-month fixture renders all month headers and stays landscape', () => {
		const doc = buildProfitLossPdf(wide, 'summary', filters);
		const lines = textIn(doc).split('\n');
		expect(doc.internal.pageSize.getWidth()).toBe(landscapeWidth);
		// narrow month columns may wrap the year (even mid-word) onto a second line —
		// stable stems must be present on their own line
		for (const stem of ['January', 'February', 'June', 'October']) {
			expect(lines).toContain(stem);
		}
		expect(lines.some((l) => l.startsWith('Dec'))).toBe(true); // December may break as Decemb/er
	});
});

describe('buildProfitLossPdf — detail view', () => {
	it('renders SKU/product rows and the Total tfoot with total margin', () => {
		const lines = textIn(buildProfitLossPdf(range, 'detail', filters)).split('\n');
		expect(lines).toContain('Profit & Loss — By Product');
		expect(lines).toContain('SKU');
		expect(lines).toContain('SKU-001');
		expect(lines).toContain('Wireless Mouse');
		expect(lines).toContain('Php 900.00');
		expect(lines).toContain('33.3%'); // 300 / 900
		expect(lines).toContain('Total');
		expect(lines).toContain('13'); // 3 + 10 qty
		expect(lines).toContain('Php 1,150.00'); // revenue total
		expect(lines).toContain('32.2%'); // 370 / 1150
		expect(lines).not.toContain('May 2026'); // no monthly content in detail view
	});

	it('empty detail renders the empty-state row and no Total tfoot', () => {
		const lines = textIn(buildProfitLossPdf(empty, 'detail', filters)).split('\n');
		expect(lines).toContain('No invoice data found for the selected date range.');
		expect(lines).not.toContain('Total');
	});
});

describe('buildProfitLossPdf — both view + filters', () => {
	it('summary, forced page break, By Product heading, then detail', () => {
		const doc = buildProfitLossPdf(range, 'both', filters);
		const lines = textIn(doc).split('\n');
		expect(lines.filter((l) => l === 'Profit & Loss')).toHaveLength(1); // bare title, not — Summary
		const headingIdx = lines.indexOf('By Product');
		expect(headingIdx).toBeGreaterThanOrEqual(0);
		const detailIdx = lines.indexOf('SKU-001');
		expect(detailIdx).toBeGreaterThan(headingIdx);
		const monthlyIdx = lines.indexOf('May 2026');
		expect(monthlyIdx).toBeLessThan(headingIdx);
		expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(2);
	});

	it('renders the date range subtitle from filters', () => {
		expect(textIn(buildProfitLossPdf(range, 'summary', filters))).toContain('May 1, 2026');
	});

	it('renders "All Dates" when no filters', () => {
		expect(textIn(buildProfitLossPdf(range, 'summary'))).toContain('All Dates');
	});
});
