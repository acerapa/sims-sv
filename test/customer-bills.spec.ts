import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Param } from 'drizzle-orm';

vi.mock('../src/lib/server/db', () => ({
	db: { select: vi.fn() }
}));

vi.mock('../src/lib/server/db/queries/customers', () => ({
	getCustomers: vi.fn().mockResolvedValue([{ id: 1, name: 'Jomar Corp' }])
}));

import { db } from '../src/lib/server/db';
import { getPaginatedCustomerBills } from '../src/lib/server/db/queries/invoices';

const selectMock = db.select as unknown as ReturnType<typeof vi.fn>;

interface StubState {
	total: number;
	rows: Record<string, unknown>[];
	outstanding: { count: number; total: string };
	dataWhere: { condParams?: unknown[] } | undefined;
	outstandingWhere: { condParams?: unknown[] } | undefined;
	offsetArg: number | undefined;
	limitArg: number | undefined;
}

const state: StubState = {
	total: 0,
	rows: [],
	outstanding: { count: 0, total: '0' },
	dataWhere: undefined,
	outstandingWhere: undefined,
	offsetArg: undefined,
	limitArg: undefined
};

const resetStub = () => {
	state.total = 0;
	state.rows = [];
	state.outstanding = { count: 0, total: '0' };
	state.dataWhere = undefined;
	state.outstandingWhere = undefined;
	state.offsetArg = undefined;
	state.limitArg = undefined;
};

beforeEach(resetStub);

/**
 * The query issues three selects — total count, the page of bills, and the ledger-wide
 * outstanding summary — routed here by their select-field keys.
 */
selectMock.mockImplementation((fields: Record<string, unknown>) => {
	if (Object.keys(fields).length === 1 && 'total' in fields) {
		const builder: Record<string, unknown> = {
			from: () => builder,
			innerJoin: () => builder,
			where: () => Promise.resolve([{ total: state.total }])
		};
		return builder as never;
	}
	if ('outstandingCount' in fields) {
		return {
			from: () => ({
				where: (cond: StubState['outstandingWhere']) => {
					state.outstandingWhere = cond;
					return Promise.resolve([
						{
							outstandingCount: state.outstanding.count,
							outstandingTotal: state.outstanding.total
						}
					]);
				}
			})
		} as never;
	}
	// the page-of-bills query: from → joins → where → orderBy → offset → limit
	const builder: Record<string, unknown> = {
		from: () => builder,
		innerJoin: () => builder,
		where: (cond: StubState['dataWhere']) => {
			state.dataWhere = cond;
			return builder;
		},
		orderBy: () => builder,
		offset: (offset: number) => {
			state.offsetArg = offset;
			return builder;
		},
		limit: (limit: number) => {
			state.limitArg = limit;
			return Promise.resolve(state.rows);
		}
	};
	return builder as never;
});

const billRow = (overrides: Record<string, unknown> = {}) => ({
	id: 11,
	customer_name: 'Jomar Corp',
	sales_order_id: 42,
	invoice_date: new Date('2026-11-01'),
	due_date: new Date('2026-11-15'),
	invoice_status: 'partially_paid',
	total_amount: '10000',
	paid_amount: '4000',
	...overrides
});

const collectChunks = (
	chunk: unknown,
	out: { params: unknown[]; strings: string[] } = { params: [], strings: [] }
): { params: unknown[]; strings: string[] } => {
	if (typeof chunk === 'string') {
		out.strings.push(chunk);
		return out;
	}
	if (chunk instanceof Param) {
		out.params.push((chunk as Param).value);
		return out;
	}
	const queryChunks = (chunk as { queryChunks?: unknown[] })?.queryChunks;
	if (Array.isArray(queryChunks)) {
		for (const child of queryChunks) collectChunks(child, out);
	}
	return out;
};

const condValues = (cond: unknown) => collectChunks(cond);

describe('getPaginatedCustomerBills', () => {
	it('maps bill rows with outstanding balances and pagination metadata', async () => {
		state.total = 23;
		state.rows = [billRow(), billRow({ id: 12, total_amount: '5000', paid_amount: '5000' })];
		state.outstanding = { count: 4, total: '1250.50' };

		const result = await getPaginatedCustomerBills({ page: 2, limit: 10 });

		expect(result.data[0]).toEqual({
			id: 11,
			customer_name: 'Jomar Corp',
			sales_order_id: 42,
			invoice_date: new Date('2026-11-01'),
			due_date: new Date('2026-11-15'),
			invoice_status: 'partially_paid',
			total_amount: '10000',
			paid_amount: '4000',
			balance: 6000
		});
		expect(result.data[1].balance).toBe(0);
		expect(result.total).toBe(23);
		expect(result.page).toBe(2);
		expect(result.limit).toBe(10);
		expect(result.totalPages).toBe(3);
		expect(state.offsetArg).toBe(10);
		expect(state.limitArg).toBe(10);
	});

	it('clamps the balance to zero when a bill is overpaid', async () => {
		state.rows = [billRow({ paid_amount: '12000' })];

		const result = await getPaginatedCustomerBills({ page: 1, limit: 10 });

		expect(result.data[0].balance).toBe(0);
	});

	it('keeps cancelled bills out of the ledger and applies search and status filters', async () => {
		await getPaginatedCustomerBills({ page: 1, limit: 10, search: 'acme', status: 'unpaid' });

		const { params, strings } = condValues(state.dataWhere);
		expect(params).toEqual(expect.arrayContaining(['cancelled', 'unpaid']));
		expect(strings).toEqual(expect.arrayContaining(['%acme%']));
	});

	it('computes the outstanding summary from the full open ledger', async () => {
		state.outstanding = { count: 4, total: '1250.50' };

		const result = await getPaginatedCustomerBills({ page: 1, limit: 10 });

		expect(result.outstanding).toEqual({ count: 4, total: 1250.5 });
		// the summary covers everything that is neither cancelled nor paid
		expect(condValues(state.outstandingWhere).params).toEqual(
			expect.arrayContaining(['cancelled', 'paid'])
		);
	});

	it('returns an empty page with zeroed pagination when there are no bills', async () => {
		const result = await getPaginatedCustomerBills({ page: 1, limit: 10 });

		expect(result.data).toEqual([]);
		expect(result.total).toBe(0);
		expect(result.totalPages).toBe(0);
		expect(result.outstanding).toEqual({ count: 0, total: 0 });
	});
});

describe('customer bills page load', () => {
	type BillsPageData = {
		paginated: { page: number; limit: number; data: { balance: number }[] };
		customers: unknown[];
		bill: unknown;
		currentParams: { search: string; status: string };
	};

	const makeLoadEvent = (params: string) =>
		({ url: { searchParams: new URLSearchParams(params) }, depends: vi.fn() }) as never;

	it('passes page, limit, search and status through to the page', async () => {
		state.total = 1;
		state.rows = [billRow()];
		const { load } = await import('../src/routes/customers/bills/+page.server');

		const data = (await load(
			makeLoadEvent('page=2&limit=20&search=acme&status=unpaid')
		)) as BillsPageData;

		expect(data.paginated.page).toBe(2);
		expect(data.paginated.limit).toBe(20);
		expect(data.paginated.data[0].balance).toBe(6000);
		expect(data.currentParams).toEqual({ search: 'acme', status: 'unpaid' });
		expect(data.customers).toHaveLength(1);
		expect(data.bill).toBeNull();
	});

	it('clamps page to at least 1 and limit between 10 and 100', async () => {
		state.total = 1;
		state.rows = [billRow()];
		const { load } = await import('../src/routes/customers/bills/+page.server');

		const data = (await load(makeLoadEvent('page=0&limit=500'))) as BillsPageData;

		expect(data.paginated.page).toBe(1);
		expect(data.paginated.limit).toBe(100);
	});

	it('defaults search to empty and unknown statuses to all', async () => {
		state.total = 1;
		state.rows = [billRow()];
		const { load } = await import('../src/routes/customers/bills/+page.server');

		const defaults = (await load(makeLoadEvent(''))) as BillsPageData;
		expect(defaults.currentParams).toEqual({ search: '', status: 'all' });

		const unknown = (await load(makeLoadEvent('status=bogus'))) as BillsPageData;
		expect(unknown.currentParams).toEqual({ search: '', status: 'all' });
	});
});
