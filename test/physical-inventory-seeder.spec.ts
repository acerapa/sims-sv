import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The physical-inventory seeder is a plain script: importing it runs main() against
// the real db module. Each test re-imports it (vi.resetModules) against a fresh
// in-memory db state and a fresh process.argv, then waits for the script to finish
// by watching client.end() — the call main() makes in its finally.
//
// The mock db routes queries by table name (not object identity — vi.resetModules
// re-instantiates the schema for the re-imported seeder) and answers them from the
// in-memory state below.

interface UserFixture {
	id: number;
	name: string;
}
interface ProductFixture {
	id: number;
	quantity: number | null;
}
interface InventoryFixture {
	id: number;
	title: string;
	notes?: string | null;
	status: 'draft' | 'finalized';
	date_finalized: Date | null;
	created_by: number;
}
interface InventoryItemFixture {
	id: number;
	physical_inventory_id: number;
	product_id: number;
	system_count: number;
	actual_count: number;
	difference: number;
}
interface DbState {
	users: UserFixture[];
	products: ProductFixture[];
	inventories: InventoryFixture[];
	inventoryItems: InventoryItemFixture[];
}

const holder = vi.hoisted(() => ({
	state: null as unknown,
	end: null as unknown
}));

vi.mock('../src/lib/server/db', async () => {
	// pull only the bound param values out of a drizzle condition (eq → Param,
	// like → raw string chunk, inArray → raw array of values or Params) — column
	// metadata such as FK-referenced table defaults must not leak into the result
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

	const { getTableName } = await import('drizzle-orm');

	const answer = (c: Record<string, unknown>): unknown => {
		const state = holder.state as DbState;
		if (c.kind === 'insert') {
			const table = getTableName(c.table as never);
			const rows = (Array.isArray(c._values) ? c._values : [c._values]) as Record<
				string,
				unknown
			>[];
			if (table === 'physical_inventory_items') {
				for (const row of rows)
					state.inventoryItems.push({ ...row } as unknown as InventoryItemFixture);
			} else if (table === 'physical_inventory') {
				for (const row of rows) state.inventories.push({ ...row } as unknown as InventoryFixture);
			} else {
				throw new Error(`Unexpected insert target in physical inventory seeder test: ${table}`);
			}
			return [];
		}
		if (c.kind === 'delete') {
			const table = getTableName(c.table as never);
			const ids = collectParams(c._cond).filter((v): v is number => typeof v === 'number');
			if (table === 'physical_inventory_items') {
				state.inventoryItems = state.inventoryItems.filter(
					(i) => !ids.includes(i.physical_inventory_id)
				);
			} else if (table === 'physical_inventory') {
				state.inventories = state.inventories.filter((p) => !ids.includes(p.id));
			} else {
				throw new Error(`Unexpected delete target in physical inventory seeder test: ${table}`);
			}
			return [];
		}
		// select
		const table = getTableName(c.fromTable as never);
		const keys = Object.keys(c.fields as Record<string, unknown>);
		const limit = (c._limit as number | undefined) ?? Infinity;
		if (table === 'users') {
			return state.users.map((u) => ({ id: u.id }));
		}
		if (table === 'products') {
			return [...state.products].sort((a, b) => a.id - b.id);
		}
		if (keys.includes('max')) {
			const rows = table === 'physical_inventory' ? state.inventories : state.inventoryItems;
			return [{ max: rows.reduce((m, r) => Math.max(m, r.id), 0) }];
		}
		// physical_inventory.id rows, narrowed by the FAKE- title prefix
		const isFakeQuery = collectParams(c._cond).includes('FAKE-%');
		const rows = state.inventories
			.filter((inv) => (isFakeQuery ? inv.title.startsWith('FAKE-') : false))
			.map((inv) => ({ id: inv.id }));
		return rows.slice(0, limit);
	};

	const makeChain = (kind: 'select' | 'insert' | 'delete', fieldsOrTable: unknown) => {
		const self: Record<string, unknown> = {
			kind,
			fields: kind === 'select' ? fieldsOrTable : undefined,
			table: kind !== 'select' ? fieldsOrTable : undefined,
			fromTable: undefined,
			_cond: undefined,
			_values: undefined,
			_limit: undefined,
			from: (t: unknown) => {
				self.fromTable = t;
				return self;
			},
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

// six products (exactly the seeder's minimum) — one with zero stock, one with a NULL
// quantity to cover the null→0 mapping
const baseProducts = (): ProductFixture[] => [
	{ id: 1, quantity: 10 },
	{ id: 2, quantity: 0 },
	{ id: 3, quantity: 5 },
	{ id: 4, quantity: null },
	{ id: 5, quantity: 2 },
	{ id: 6, quantity: 100 }
];

const realArgv = process.argv;
let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	vi.resetModules();
	holder.state = {
		users: [{ id: 1, name: 'Admin' }],
		products: baseProducts(),
		inventories: [],
		inventoryItems: []
	};
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
	process.argv = ['node', 'seed:physical-inventory', ...argv];
	await import('../src/lib/server/db/seeders/physical-inventory-data');
	await vi.waitFor(() => expect(holder.end).toHaveBeenCalled());
};

const state = (): DbState => holder.state as DbState;
const itemsFor = (inventoryId: number) =>
	state()
		.inventoryItems.filter((i) => i.physical_inventory_id === inventoryId)
		.map((i) => ({
			product_id: i.product_id,
			system_count: i.system_count,
			actual_count: i.actual_count,
			difference: i.difference
		}));

describe('physical inventory seeder — happy path', () => {
	it('seeds the requested number of FAKE- inventories with unique titles', async () => {
		await runSeeder('4');

		expect(state().inventories).toHaveLength(4);
		for (const inv of state().inventories) {
			expect(inv.title).toMatch(/^FAKE-\S+ \S+ \d{3}$/);
		}
		expect(new Set(state().inventories.map((i) => i.title)).size).toBe(4);
	});

	it('gives each inventory 2–6 distinct real products', async () => {
		await runSeeder('4');

		for (const inv of state().inventories) {
			const rows = itemsFor(inv.id);
			expect(rows.length).toBeGreaterThanOrEqual(2);
			expect(rows.length).toBeLessThanOrEqual(6);
			expect(new Set(rows.map((r) => r.product_id)).size).toBe(rows.length);
			for (const row of rows) {
				expect(state().products.some((p) => p.id === row.product_id)).toBe(true);
			}
		}
	});

	it('seeds counts like a real count: system stock, drifted actual, and a consistent difference', async () => {
		await runSeeder('4');

		for (const inv of state().inventories) {
			expect(inv.created_by).toBe(1);
			for (const row of itemsFor(inv.id)) {
				const product = state().products.find((p) => p.id === row.product_id);
				expect(row.system_count).toBe(product?.quantity ?? 0);
				expect(row.actual_count).toBeGreaterThanOrEqual(0);
				expect(row.difference).toBe(row.actual_count - row.system_count);
				expect(Math.abs(row.difference)).toBeLessThanOrEqual(3);
			}
		}
	});

	it('keeps a mix of finalized and draft inventories, with date_finalized only on finalized ones', async () => {
		await runSeeder('10');

		const finalized = state().inventories.filter((i) => i.status === 'finalized');
		const draft = state().inventories.filter((i) => i.status === 'draft');
		expect(finalized).toHaveLength(4);
		expect(draft).toHaveLength(6);
		for (const inv of finalized) {
			expect(inv.date_finalized).toBeInstanceOf(Date);
			expect(inv.date_finalized!.getTime()).toBeGreaterThan(Date.now() - 61 * 86_400_000);
		}
		for (const inv of draft) {
			expect(inv.date_finalized).toBeNull();
		}
	});

	it('allocates explicit ids above the highest existing inventory and item ids', async () => {
		(state().inventories as InventoryFixture[]).push({
			id: 50,
			title: 'Real Count',
			status: 'finalized',
			date_finalized: new Date(),
			created_by: 1
		});
		(state() as DbState).inventoryItems.push({
			id: 90,
			physical_inventory_id: 50,
			product_id: 1,
			system_count: 10,
			actual_count: 10,
			difference: 0
		});
		await runSeeder('4');

		expect(
			state()
				.inventories.filter((i) => i.title.startsWith('FAKE-'))
				.map((i) => i.id)
		).toEqual([51, 52, 53, 54]);
		const itemIds = state()
			.inventoryItems.filter((i) => i.id > 90)
			.map((i) => i.id);
		expect(itemIds.length).toBeGreaterThan(0);
		expect(new Set(itemIds).size).toBe(itemIds.length);
	});

	it('uses the default count of 10 when no count argument is given', async () => {
		await runSeeder();

		expect(state().inventories).toHaveLength(10);
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining('Physical inventories seeded — 10 inventories')
		);
	});
});

describe('physical inventory seeder — fail-fast and idempotency', () => {
	it('fails fast with a hint when no users exist', async () => {
		(state() as DbState).users = [];
		await runSeeder('1');

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining('Error in physical inventory seeder script:'),
			expect.objectContaining({
				message: expect.stringContaining('No users found — run npm run seed:admin-user first')
			})
		);
		expect(process.exitCode).toBe(1);
		expect(state().inventories).toHaveLength(0);
		expect(state().inventoryItems).toHaveLength(0);
	});

	it('fails fast with a hint when no products exist', async () => {
		(state() as DbState).products = [];
		await runSeeder('1');

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining('Error in physical inventory seeder script:'),
			expect.objectContaining({
				message: expect.stringContaining(
					'No products found — run npm run seed:fake-data or seed:str first'
				)
			})
		);
		expect(process.exitCode).toBe(1);
		expect(state().inventories).toHaveLength(0);
	});

	it('fails fast when there are fewer than six products, without writing anything', async () => {
		(state() as DbState).products = baseProducts().slice(0, 5);
		await runSeeder('1');

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining('Error in physical inventory seeder script:'),
			expect.objectContaining({
				message: expect.stringContaining('Need at least 6 distinct products')
			})
		);
		expect(process.exitCode).toBe(1);
		expect(state().inventories).toHaveLength(0);
		expect(state().inventoryItems).toHaveLength(0);
	});

	it('refuses to re-seed when FAKE- inventories already exist', async () => {
		(state().inventories as InventoryFixture[]).push({
			id: 7,
			title: 'FAKE-Cycle Count 001',
			status: 'draft',
			date_finalized: null,
			created_by: 1
		});
		await runSeeder('10');

		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining(
				'Fake inventory data already present — run npm run seed:physical-inventory:cleanup first'
			)
		);
		expect(state().inventories).toHaveLength(1); // the pre-existing fake, nothing added
		expect(state().inventoryItems).toHaveLength(0);
	});

	it('rejects a non-numeric count without touching the database', async () => {
		await runSeeder('abc');

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining('Error in physical inventory seeder script:'),
			expect.objectContaining({ message: expect.stringContaining('Invalid count "abc"') })
		);
		expect(process.exitCode).toBe(1);
		expect(state().inventories).toHaveLength(0);
	});
});

describe('physical inventory seeder — cleanup', () => {
	it('removes only FAKE- inventories and their items', async () => {
		(state().inventories as InventoryFixture[]).push(
			{
				id: 1,
				title: 'Year-End 2026',
				status: 'finalized',
				date_finalized: new Date(),
				created_by: 1
			},
			{
				id: 2,
				title: 'FAKE-Cycle Count 001',
				status: 'draft',
				date_finalized: null,
				created_by: 1
			},
			{
				id: 3,
				title: 'FAKE-Quarterly Stocktake 002',
				status: 'draft',
				date_finalized: null,
				created_by: 1
			}
		);
		(state() as DbState).inventoryItems.push(
			{
				id: 1,
				physical_inventory_id: 1,
				product_id: 1,
				system_count: 10,
				actual_count: 10,
				difference: 0
			},
			{
				id: 2,
				physical_inventory_id: 2,
				product_id: 2,
				system_count: 0,
				actual_count: 1,
				difference: 1
			},
			{
				id: 3,
				physical_inventory_id: 3,
				product_id: 3,
				system_count: 5,
				actual_count: 4,
				difference: -1
			}
		);
		await runSeeder('cleanup');

		expect(state().inventories).toHaveLength(1);
		expect(state().inventories[0].title).toBe('Year-End 2026');
		expect(state().inventoryItems.map((i) => i.id)).toEqual([1]);
		expect(logSpy).toHaveBeenCalledWith(
			'Cleaned up — 2 fake inventories and their items (real rows untouched)'
		);
	});

	it('is a no-op when no FAKE- inventories exist', async () => {
		(state().inventories as InventoryFixture[]).push({
			id: 1,
			title: 'Year-End 2026',
			status: 'finalized',
			date_finalized: new Date(),
			created_by: 1
		});
		await runSeeder('cleanup');

		expect(state().inventories).toHaveLength(1);
		expect(logSpy).toHaveBeenCalledWith(
			'Cleaned up — 0 fake inventories and their items (real rows untouched)'
		);
	});
});
