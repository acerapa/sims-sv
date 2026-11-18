import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The customer seeder is a plain script: importing it runs main() against the
// real db module. Each test re-imports it (vi.resetModules) against a fresh
// in-memory db state and a fresh process.argv, then waits for the script to
// finish by watching client.end() — the call main() makes in its finally.

interface CustomerFixture {
	id: number;
	name: string;
	address?: string;
	phone?: string;
	viber?: string;
	fb_account?: string;
}
interface DbState {
	customers: CustomerFixture[];
}

const holder = vi.hoisted(() => ({
	state: null as unknown,
	end: null as unknown
}));

vi.mock('../src/lib/server/db', async () => {
	// getTableName by name (not object identity): vi.resetModules() re-instantiates
	// the schema for the re-imported seeder, so static imports here would be stale
	const { getTableName } = await import('drizzle-orm');
	// pull only the bound param values out of a drizzle condition (eq → Param,
	// like → raw string chunk, inArray → raw array of values) — column metadata
	// such as FK-referenced table defaults must not leak into the result
	const collectParams = (cond: unknown): (string | number)[] => {
		const chunks = (cond as { queryChunks?: unknown[] } | undefined)?.queryChunks;
		if (!chunks) return [];
		const out: (string | number)[] = [];
		for (const chunk of chunks) {
			if (typeof chunk === 'string' || typeof chunk === 'number') {
				out.push(chunk);
			} else if (Array.isArray(chunk)) {
				for (const v of chunk) {
					if (typeof v === 'string' || typeof v === 'number') out.push(v);
					else if (v && typeof v === 'object' && 'value' in (v as object)) {
						const inner = (v as { value: unknown }).value;
						if (typeof inner === 'string' || typeof inner === 'number') out.push(inner);
					}
				}
			} else if (chunk && typeof chunk === 'object' && 'value' in (chunk as object)) {
				const v = (chunk as { value: unknown }).value;
				if (typeof v === 'string' || typeof v === 'number') out.push(v);
			}
		}
		return out;
	};

	const answer = (c: Record<string, unknown>): unknown => {
		const state = holder.state as DbState;
		if (c.kind === 'insert') {
			const table = getTableName(c.table as never);
			const rows = (Array.isArray(c._values) ? c._values : [c._values]) as Record<
				string,
				unknown
			>[];
			if (table === 'customers') {
				for (const row of rows) state.customers.push({ ...row } as unknown as CustomerFixture);
			} else {
				throw new Error(`Unexpected insert target in customers seeder test: ${table}`);
			}
			return [];
		}
		if (c.kind === 'delete') {
			const table = getTableName(c.table as never);
			const ids = collectParams(c._cond).filter((v): v is number => typeof v === 'number');
			if (table === 'customers') {
				state.customers = state.customers.filter((p) => !ids.includes(p.id));
			} else {
				throw new Error(`Unexpected delete target in customers seeder test: ${table}`);
			}
			return [];
		}
		// select
		const keys = Object.keys(c.fields as Record<string, unknown>);
		const limit = (c._limit as number | undefined) ?? Infinity;
		if (keys.includes('max')) {
			return [{ max: state.customers.reduce((m, p) => Math.max(m, p.id), 0) }];
		}
		// customers.id rows, narrowed by the where condition
		const vals = collectParams(c._cond);
		const isFakeQuery = vals.includes('FAKE-%');
		const name = isFakeQuery
			? undefined
			: vals.find((v) => typeof v === 'string' && !v.includes('%'));
		const rows = state.customers
			.filter((p) => (isFakeQuery ? p.name.startsWith('FAKE-') : p.name === name))
			.map((p) => ({ id: p.id }));
		return rows.slice(0, limit);
	};

	const makeChain = (kind: 'select' | 'insert' | 'delete', fieldsOrTable: unknown) => {
		const self: Record<string, unknown> = {
			kind,
			fields: kind === 'select' ? fieldsOrTable : undefined,
			table: kind !== 'select' ? fieldsOrTable : undefined,
			_cond: undefined,
			_values: undefined,
			_limit: undefined,
			from: () => self,
			innerJoin: () => self,
			orderBy: () => self,
			limit: (n: number) => {
				self._limit = n;
				return self;
			},
			where: (cond: unknown) => {
				self._cond = cond;
				return self;
			},
			values: (v: unknown) => {
				self._values = v;
				return self;
			},
			then: (res: (v: unknown) => void, rej: (e: unknown) => void) => {
				Promise.resolve()
					.then(() => answer(self))
					.then(res)
					.catch(rej);
			}
		};
		return self;
	};

	return {
		db: {
			select: (fields: unknown) => makeChain('select', fields),
			insert: (table: unknown) => makeChain('insert', table),
			delete: (table: unknown) => makeChain('delete', table)
		},
		client: {
			end: () => (holder.end as () => void)?.()
		}
	};
});

// the walk-in customer and a real client are present from the start — they must
// survive seeding and cleanup untouched
const baseCustomers = (): CustomerFixture[] => [
	{ id: 1, name: 'Walk-in Customer', address: '' },
	{ id: 2, name: 'Jomar Corp', address: '123 Market St' }
];

const realArgv = process.argv;
let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	vi.resetModules();
	holder.state = { customers: baseCustomers() };
	holder.end = vi.fn();
	process.exitCode = undefined;
	logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
	errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
	process.argv = realArgv;
});

const runSeeder = async (...argv: string[]) => {
	process.argv = ['node', 'seed:customers', ...argv];
	await import('../src/lib/server/db/seeders/customers');
	await vi.waitFor(() => expect(holder.end).toHaveBeenCalled());
};

const state = (): DbState => holder.state as DbState;

describe('customers seeder — curated clients', () => {
	it('seeds the four curated clients', async () => {
		await runSeeder('4');

		expect(state().customers.filter((c) => c.name.startsWith('FAKE-'))).toHaveLength(0);
		expect(state().customers.map((c) => c.name)).toEqual(
			expect.arrayContaining([
				'Blue Harbor Trading',
				'San Roque General Store',
				'Calbayog Office Supplies',
				'Maria Santos'
			])
		);
	});

	it('gives each curated client full contact fields', async () => {
		await runSeeder('4');

		const blueHarbor = state().customers.find((c) => c.name === 'Blue Harbor Trading');
		expect(blueHarbor).toMatchObject({
			address: 'Lot 3, National Highway, Calbayog City',
			phone: '0917 555 0201',
			viber: '0917 555 0201',
			fb_account: 'blueharbortrading'
		});
	});

	it('allocates explicit ids above the highest existing customer id', async () => {
		(state().customers as CustomerFixture[]).push({ id: 100, name: 'Real Client' });
		await runSeeder('4');

		expect(
			state()
				.customers.filter((c) => c.name !== 'Real Client')
				.map((c) => c.id)
				.sort((a, b) => a - b)
		).toEqual([1, 2, 101, 102, 103, 104]);
	});

	it('skips a curated client that already exists and keeps the id range gap-free', async () => {
		(state().customers as CustomerFixture[]).push({ id: 5, name: 'Blue Harbor Trading' });
		await runSeeder('4');

		expect(state().customers.filter((c) => c.name === 'Blue Harbor Trading')).toHaveLength(1);
		expect(
			state()
				.customers.filter((c) => !c.name.startsWith('Walk-in') && c.name !== 'Jomar Corp')
				.map((c) => c.id)
				.sort((a, b) => a - b)
		).toEqual([5, 6, 7, 8]);
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining('3 created, 1 already existed (4 curated, 0 generated)')
		);
	});
});

describe('customers seeder — generated FAKE- customers', () => {
	it('fills the requested total with uniquely named FAKE- customers', async () => {
		(state().customers as CustomerFixture[]).push({ id: 100, name: 'Real Client' });
		await runSeeder('6');

		const fakes = state().customers.filter((c) => c.name.startsWith('FAKE-'));
		expect(fakes).toHaveLength(2);
		expect(new Set(fakes.map((c) => c.name)).size).toBe(2);
		for (const fake of fakes) {
			expect(fake.name).toMatch(/^FAKE-\w+ \w+ \d{3}$/);
			expect(fake.phone).toMatch(/^09\d{2} 555 \d{4}$/);
			expect(fake.viber).toBe(fake.phone);
			expect(fake.fb_account).toBeTruthy();
			expect(fake.address).toBeTruthy();
		}
	});

	it('uses the default count of 10 when no count argument is given', async () => {
		await runSeeder();

		expect(state().customers.filter((c) => c.name.startsWith('FAKE-'))).toHaveLength(6);
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining('10 created, 0 already existed (4 curated, 6 generated)')
		);
	});
});

describe('customers seeder — idempotency and input validation', () => {
	it('refuses to re-seed when FAKE- customers already exist', async () => {
		(state().customers as CustomerFixture[]).push({ id: 7, name: 'FAKE-Marco Garcia 001' });
		await runSeeder('10');

		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining(
				'Fake customer data already present — run npm run seed:customers:cleanup first'
			)
		);
		expect(state().customers).toHaveLength(3); // walk-in, Jomar, pre-existing fake
	});

	it('rejects a non-numeric count without touching the database', async () => {
		await runSeeder('abc');

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining('Error in customer seeder script:'),
			expect.objectContaining({ message: expect.stringContaining('Invalid count "abc"') })
		);
		expect(process.exitCode).toBe(1);
		expect(state().customers).toHaveLength(2);
	});

	it('rejects a zero count', async () => {
		await runSeeder('0');

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining('Error in customer seeder script:'),
			expect.objectContaining({ message: expect.stringContaining('Invalid count "0"') })
		);
		expect(process.exitCode).toBe(1);
		expect(state().customers).toHaveLength(2);
	});
});

describe('customers seeder — cleanup', () => {
	it('removes only FAKE- customers (curated, real, and walk-in rows untouched)', async () => {
		(state().customers as CustomerFixture[]).push(
			{ id: 3, name: 'Blue Harbor Trading' },
			{ id: 4, name: 'FAKE-Marco Garcia 001' },
			{ id: 5, name: 'FAKE-Liza Reyes 002' }
		);
		await runSeeder('cleanup');

		expect(
			state()
				.customers.map((c) => c.id)
				.sort((a, b) => a - b)
		).toEqual([1, 2, 3]);
		expect(logSpy).toHaveBeenCalledWith(
			'Cleaned up — 2 fake customers (curated and real rows untouched)'
		);
	});

	it('is a no-op when no FAKE- customers exist', async () => {
		(state().customers as CustomerFixture[]).push({ id: 3, name: 'Blue Harbor Trading' });
		await runSeeder('cleanup');

		expect(state().customers).toHaveLength(3);
		expect(logSpy).toHaveBeenCalledWith(
			'Cleaned up — 0 fake customers (curated and real rows untouched)'
		);
	});
});
