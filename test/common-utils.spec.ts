import { describe, expect, it } from 'vitest';
import { formatCurrency, formatPlainCurrency } from '../src/lib/utils/common';

describe('formatPlainCurrency — bare amounts for the D.R. item rows', () => {
	// same input handling as formatCurrency, minus the ₱ symbol (client, 2026-11)
	it.each([
		[100, '100.00'],
		[0, '0.00'],
		[1999602.3, '1,999,602.30'],
		['1234.5', '1,234.50'],
		['9.99', '9.99'],
		['', '0.00']
	])('formats %p as %s', (input, expected) => {
		expect(formatPlainCurrency(input)).toBe(expected);
		expect(formatPlainCurrency(input)).not.toContain('₱');
	});

	it('formats the same values as formatCurrency with the symbol stripped', () => {
		for (const value of [100, 0, '1234.5', '9.99', '']) {
			expect(formatPlainCurrency(value)).toBe(formatCurrency(value).replace('₱', ''));
		}
	});
});
