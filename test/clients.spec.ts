import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/server/db', () => ({
	db: { select: vi.fn() }
}));

import { db } from '../src/lib/server/db';
import { getPaginatedCustomers } from '../src/lib/server/db/queries/customers';

const selectMock = db.select as unknown as ReturnType<typeof vi.fn>;

interface StubState {
	total: number;
	rows: Record<string, unknown>[];
	orderByArgs: unknown[] | undefined;
	offsetArg: number | undefined;
	limitArg: number | undefined;
}

const state: StubState = {
	total: 0,
	rows: [],
	orderByArgs: undefined,
	offsetArg: undefined,
	limitArg: undefined
};

beforeEach(() => {
	state.total = 0;
	state.rows = [];
	state.orderByArgs = undefined;
	state.offsetArg = undefined;
	state.limitArg = undefined;
});

/**
 * The query issues two selects — total count, then the page of clients —
 * routed here by their select-field keys.
 */
selectMock.mockImplementation((fields: Record<string, unknown>) => {
	if (Object.keys(fields).length === 1 && 'total' in fields) {
		return { from: () => Promise.resolve([{ total: state.total }]) } as never;
	}
	const builder: Record<string, unknown> = {
		from: () => builder,
		orderBy: (...args: unknown[]) => {
			state.orderByArgs = args;
			return builder;
		},
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

const clientRow = (overrides: Record<string, unknown> = {}) => ({
	id: 1,
	name: 'Jomar Corp',
	address: '123 Market St',
	phone: '09171234567',
	viber: null,
	fb_account: 'jomar.corp',
	...overrides
});

const orderColumnNames = (args: unknown[] | undefined) =>
	(args ?? []).flatMap((chunk) => {
		const queryChunks = (chunk as { queryChunks?: unknown[] })?.queryChunks;
		return Array.isArray(queryChunks)
			? queryChunks.map((c) => (c as { name?: string })?.name ?? null)
			: [];
	});

describe('getPaginatedCustomers', () => {
	it('returns a page of clients with pagination metadata', async () => {
		state.total = 25;
		state.rows = [clientRow(), clientRow({ id: 2, name: 'ACME Trading' })];

		const result = await getPaginatedCustomers(2, 10);

		expect(result.data).toEqual([clientRow(), clientRow({ id: 2, name: 'ACME Trading' })]);
		expect(result.total).toBe(25);
		expect(result.page).toBe(2);
		expect(result.limit).toBe(10);
		expect(result.totalPages).toBe(3);
		expect(state.offsetArg).toBe(10);
		expect(state.limitArg).toBe(10);
	});

	it('orders clients by name so pages are stable', async () => {
		await getPaginatedCustomers(1, 10);

		expect(state.orderByArgs).toBeDefined();
		expect(orderColumnNames(state.orderByArgs)).toContain('name');
	});

	it('returns an empty page with zeroed pagination when there are no clients', async () => {
		const result = await getPaginatedCustomers(1, 10);

		expect(result.data).toEqual([]);
		expect(result.total).toBe(0);
		expect(result.totalPages).toBe(0);
	});
});

describe('clients page load', () => {
	const makeLoadEvent = (params: string) =>
		({ url: { searchParams: new URLSearchParams(params) }, depends: vi.fn() }) as never;

	type ClientsPageData = {
		paginated: { page: number; limit: number; data: unknown[] };
	};

	it('passes page and limit through to the page', async () => {
		state.total = 1;
		state.rows = [clientRow()];
		const { load } = await import('../src/routes/customers/clients/+page.server');

		const data = (await load(makeLoadEvent('page=2&limit=20'))) as ClientsPageData;

		expect(data.paginated.page).toBe(2);
		expect(data.paginated.limit).toBe(20);
		expect(data.paginated.data).toHaveLength(1);
	});

	it('clamps page to at least 1 and limit between 10 and 100', async () => {
		state.total = 1;
		state.rows = [clientRow()];
		const { load } = await import('../src/routes/customers/clients/+page.server');

		const data = (await load(makeLoadEvent('page=0&limit=500'))) as ClientsPageData;

		expect(data.paginated.page).toBe(1);
		expect(data.paginated.limit).toBe(100);
	});
});
