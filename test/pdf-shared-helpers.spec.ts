import { describe, expect, it } from 'vitest';
import {
	capitalizeFirst,
	dateRangeLabel,
	formatCurrencyPdf,
	formatDatePdf,
	safeNum,
	titleCase
} from '../src/lib/utils/pdf';

// Unit-level behavior tests for the shared print helpers consolidated from the
// per-route print/pdf.ts copies (ai-docs/pdf-shared-helpers-spec.md, T1/T2/T6).
// The rendered-PDF side is covered by the *-printable specs; this pins the
// pure contracts (including decisions D1: en-US locale, D2: interior-case
// preserving titleCase) that those builders inherit.

describe('formatCurrencyPdf', () => {
	it('renders Php with 2 decimals for numbers', () => {
		expect(formatCurrencyPdf(1234.5)).toBe('Php 1,234.50');
	});

	it('parses string numerics (Postgres numeric arrives as a string)', () => {
		expect(formatCurrencyPdf('1234.5')).toBe('Php 1,234.50');
	});

	it('renders 0.00 for null and undefined instead of crashing', () => {
		expect(formatCurrencyPdf(null)).toBe('Php 0.00');
		expect(formatCurrencyPdf(undefined)).toBe('Php 0.00');
	});
});

describe('safeNum', () => {
	it('coerces string and number amounts to finite numbers', () => {
		expect(safeNum('1234.5')).toBe(1234.5);
		expect(safeNum(1899)).toBe(1899);
	});

	it('returns 0 for null, undefined and non-numeric input', () => {
		expect(safeNum(null)).toBe(0);
		expect(safeNum(undefined)).toBe(0);
		expect(safeNum('')).toBe(0);
		expect(safeNum('abc')).toBe(0);
	});
});

describe('formatDatePdf (decision D1 — en-US)', () => {
	it('formats Date and date-string values as "July 15, 2026"', () => {
		expect(formatDatePdf(new Date(2026, 6, 15))).toBe('July 15, 2026');
		expect(formatDatePdf('2026-07-15')).toBe('July 15, 2026');
	});

	it('returns an empty string for null, undefined and empty string', () => {
		expect(formatDatePdf(null)).toBe('');
		expect(formatDatePdf(undefined)).toBe('');
		expect(formatDatePdf('')).toBe('');
	});
});

describe('dateRangeLabel', () => {
	it('falls back to "All Dates" with no filters', () => {
		expect(dateRangeLabel()).toBe('All Dates');
		expect(dateRangeLabel({})).toBe('All Dates');
	});

	it('renders one-sided ranges as From/Up to labels', () => {
		expect(dateRangeLabel({ from: '2026-07-15', to: null })).toBe('From July 15, 2026');
		expect(dateRangeLabel({ from: null, to: '2026-07-15' })).toBe('Up to July 15, 2026');
	});

	it('renders a full range with an em dash', () => {
		expect(dateRangeLabel({ from: '2026-07-01', to: '2026-07-15' })).toBe(
			'July 1, 2026 — July 15, 2026'
		);
	});
});

describe('titleCase (decision D2 — preserves interior case, like CSS capitalize)', () => {
	it('capitalizes each word of lowercase input', () => {
		expect(titleCase('cash on delivery')).toBe('Cash On Delivery');
	});

	it('keeps already-titled and multi-word values intact', () => {
		expect(titleCase('Pending Payment')).toBe('Pending Payment');
	});

	it('does not lowercase acronyms or words with interior capitals', () => {
		expect(titleCase('COD')).toBe('COD');
	});

	it('ignores underscore-joined tokens (no word boundary, like CSS)', () => {
		expect(titleCase('cheque_clearance')).toBe('Cheque_clearance');
	});

	it('tolerates extra whitespace without duplicating empty words', () => {
		expect(titleCase('  padded   value ')).toBe('Padded Value');
	});
});

describe('capitalizeFirst', () => {
	it('uppercases only the first letter', () => {
		expect(capitalizeFirst('admin')).toBe('Admin');
		expect(capitalizeFirst('already')).toBe('Already');
	});

	it('returns empty string unchanged', () => {
		expect(capitalizeFirst('')).toBe('');
	});
});
