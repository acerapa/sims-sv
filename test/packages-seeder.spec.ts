import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The package seeder is a plain script: importing it runs main() against the
// real db module. Each test re-imports it (vi.resetModules) against a fresh
// in-memory db state and a fresh process.argv, then waits for the script to
// finish by watching client.end() — the call main() makes in its finally.

interface ProductFixture {
	id: number;
	sale_price: string | null;
	category: string;
}
interface PackageFixture {
	id: number;
	name: string;
	description?: string | null;
	total_price?: string | null;
}
interface PackageItemFixture {
	package_id: number;
	product_id: number;
	quantity: number;
	serial_number: string | null;
	price: string | null;
	total_price: string | null;
}
interface DbState {
	products: ProductFixture[];
	packages: PackageFixture[];
	packageItems: PackageItemFixture[];
}

const holder = vi.hoisted(() => ({
	state: null as unknown,
	end: null as unknown
}));

vi.mock('../src/lib/server/db', async () => {
	// getTable by name (not object identity): vi.resetModules() re-instantiates
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
			if (table === 'packages_to_products') {
				for (const row of rows)
					state.packageItems.push({ ...row } as unknown as PackageItemFixture);
			} else if (table === 'packages') {
				for (const row of rows) state.packages.push({ ...row } as unknown as PackageFixture);
			} else {
				throw new Error(`Unexpected insert target in packages seeder test: ${table}`);
			}
			return [];
		}
		if (c.kind === 'delete') {
			const table = getTableName(c.table as never);
			const ids = collectParams(c._cond).filter((v): v is number => typeof v === 'number');
			if (table === 'packages_to_products') {
				state.packageItems = state.packageItems.filter((i) => !ids.includes(i.package_id));
			} else if (table === 'packages') {
				state.packages = state.packages.filter((p) => !ids.includes(p.id));
			} else {
				throw new Error(`Unexpected delete target in packages seeder test: ${table}`);
			}
			return [];
		}
		// select
		const keys = Object.keys(c.fields as Record<string, unknown>);
		const limit = (c._limit as number | undefined) ?? Infinity;
		if (keys.includes('category')) {
			return [...state.products]
				.sort((a, b) => a.id - b.id)
				.map((p) => ({ id: p.id, sale_price: p.sale_price, category: p.category }))
				.slice(0, limit);
		}
		if (keys.includes('sale_price')) {
			return [...state.products]
				.sort((a, b) => a.id - b.id)
				.map((p) => ({ id: p.id, sale_price: p.sale_price }))
				.slice(0, limit);
		}
		if (keys.includes('max')) {
			return [{ max: state.packages.reduce((m, p) => Math.max(m, p.id), 0) }];
		}
		// packages.id rows, narrowed by the where condition
		const vals = collectParams(c._cond);
		const isFakeQuery = vals.includes('FAKE-%');
		const name = isFakeQuery
			? undefined
			: state.packages.map((p) => p.name).find((n) => vals.includes(n));
		const rows = state.packages
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

// one product per curated category — id 9 (Audio) has a NULL sale price to cover
// the null→'0' mapping
const baseProducts = (): ProductFixture[] => [
	{ id: 1, sale_price: '10000', category: 'Processors' },
	{ id: 2, sale_price: '6500', category: 'Motherboards' },
	{ id: 3, sale_price: '2800', category: 'Memory' },
	{ id: 4, sale_price: '3200', category: 'Storage' },
	{ id: 5, sale_price: '2400', category: 'Power Supplies' },
	{ id: 6, sale_price: '1800', category: 'Computer Cases' },
	{ id: 7, sale_price: '18500', category: 'Graphics Cards' },
	{ id: 8, sale_price: '1500', category: 'Cooling' },
	{ id: 9, sale_price: null, category: 'Audio' },
	{ id: 10, sale_price: '8999', category: 'Monitors' },
	{ id: 11, sale_price: '1200', category: 'Keyboards' },
	{ id: 12, sale_price: '850', category: 'Mice' }
];

const realArgv = process.argv;
let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	vi.resetModules();
	holder.state = { products: baseProducts(), packages: [], packageItems: [] };
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
	process.argv = ['node', 'seed:packages', ...argv];
	await import('../src/lib/server/db/seeders/packages');
	await vi.waitFor(() => expect(holder.end).toHaveBeenCalled());
};

const state = (): DbState => holder.state as DbState;
const itemRowsFor = (packageId: number) =>
	state()
		.packageItems.filter((i) => i.package_id === packageId)
		.map((i) => ({
			product_id: i.product_id,
			quantity: i.quantity,
			price: i.price,
			total_price: i.total_price
		}));
const sumOf = (rows: { total_price: string | null }[]) =>
	rows.reduce((sum, r) => sum + Number(r.total_price ?? 0), 0);

describe('packages seeder — curated bundles', () => {
	it('seeds the four curated bundles resolved to the first product of each category', async () => {
		await runSeeder('4');

		expect(state().packages).toHaveLength(4);
		expect(state().packages.map((p) => p.name)).toEqual([
			'Office Desktop PC',
			'Gaming Desktop PC',
			'Media Editing Workstation',
			'Starter Peripheral Set'
		]);
	});

	it('prices each row from the product sale price and totals the package', async () => {
		await runSeeder('4');

		const office = state().packages.find((p) => p.name === 'Office Desktop PC');
		expect(office?.total_price).toBe('26700'); // 10000+6500+2800+3200+2400+1800
		expect(itemRowsFor(office?.id ?? -1).map((r) => r.product_id)).toEqual([1, 2, 3, 4, 5, 6]);

		const rows = itemRowsFor(office?.id ?? -1);
		for (const row of rows) {
			const product = baseProducts().find((p) => p.id === row.product_id);
			expect(row.quantity).toBe(1);
			expect(row.price).toBe(product?.sale_price ?? '0');
			expect(row.total_price).toBe(product?.sale_price ?? '0');
		}
	});

	it('treats a NULL sale price as zero in the bundle total', async () => {
		await runSeeder('4');

		const media = state().packages.find((p) => p.name === 'Media Editing Workstation');
		// 10000+6500+2800+3200+1500+0(audio)+2400+1800
		expect(media?.total_price).toBe('28200');
		const audioRow = itemRowsFor(media?.id ?? -1).find((r) => r.product_id === 9);
		expect(audioRow?.price).toBe('0');
		expect(audioRow?.total_price).toBe('0');
	});

	it('allocates explicit ids above the highest existing package id', async () => {
		(state().packages as PackageFixture[]).push({ id: 100, name: 'Real Bundle' });
		await runSeeder('4');

		expect(
			state()
				.packages.filter((p) => p.name !== 'Real Bundle')
				.map((p) => p.id)
		).toEqual([101, 102, 103, 104]);
	});

	it('skips a curated bundle that already exists and keeps the id range gap-free', async () => {
		(state().packages as PackageFixture[]).push({ id: 5, name: 'Office Desktop PC' });
		await runSeeder('4');

		expect(state().packages).toHaveLength(4); // pre-existing one + 3 new
		expect(state().packages.find((p) => p.id === 5)?.name).toBe('Office Desktop PC');
		expect(
			state()
				.packages.map((p) => p.id)
				.sort((a, b) => a - b)
		).toEqual([5, 6, 7, 8]);
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining('3 created, 1 already existed (4 curated, 0 generated)')
		);
	});
});

describe('packages seeder — generated FAKE- bundles', () => {
	it('fills the requested total with FAKE- bundles of 2–6 distinct real products', async () => {
		(state().packages as PackageFixture[]).push({ id: 100, name: 'Real Bundle' });
		await runSeeder('6');

		const fakes = state().packages.filter((p) => p.name.startsWith('FAKE-'));
		expect(fakes).toHaveLength(2);
		expect(new Set(fakes.map((p) => p.name)).size).toBe(2);
		for (const fake of fakes) {
			expect(fake.name).toMatch(/^FAKE-\w+ \w+ \d{3}$/);
			const rows = itemRowsFor(fake.id);
			expect(rows.length).toBeGreaterThanOrEqual(2);
			expect(rows.length).toBeLessThanOrEqual(6);
			expect(new Set(rows.map((r) => r.product_id)).size).toBe(rows.length);
			for (const row of rows) {
				const product = state().products.find((p) => p.id === row.product_id);
				expect(product).toBeDefined();
				expect(row.price).toBe(product?.sale_price ?? '0');
			}
			expect(Number(fake.total_price)).toBe(sumOf(rows));
		}
	});

	it('uses the default count of 10 when no count argument is given', async () => {
		await runSeeder();

		expect(state().packages).toHaveLength(10);
		expect(state().packages.filter((p) => p.name.startsWith('FAKE-'))).toHaveLength(6);
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining('10 created, 0 already existed (4 curated, 6 generated)')
		);
	});
});

describe('packages seeder — fail-fast and idempotency', () => {
	it('fails fast with a hint when no products exist', async () => {
		(state() as DbState).products = [];
		await runSeeder('1');

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining('Error in package seeder script:'),
			expect.objectContaining({
				message: expect.stringContaining(
					'No products found — run npm run seed:fake-data or seed:str first'
				)
			})
		);
		expect(process.exitCode).toBe(1);
		expect(state().packages).toHaveLength(0);
		expect(state().packageItems).toHaveLength(0);
	});

	it('fails fast naming the package and missing category, without writing anything', async () => {
		(state() as DbState).products = baseProducts().filter((p) => p.category !== 'Audio');
		await runSeeder('4');

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining('Error in package seeder script:'),
			expect.objectContaining({
				message: expect.stringContaining(
					'Cannot create package "Media Editing Workstation": no product found in category "Audio"'
				)
			})
		);
		expect(process.exitCode).toBe(1);
		expect(state().packages).toHaveLength(0);
		expect(state().packageItems).toHaveLength(0);
	});

	it('refuses to re-seed when FAKE- packages already exist', async () => {
		(state().packages as PackageFixture[]).push({ id: 7, name: 'FAKE-Gamer PC 001' });
		await runSeeder('10');

		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining(
				'Fake package data already present — run npm run seed:packages:cleanup first'
			)
		);
		expect(state().packages).toHaveLength(1); // the pre-existing fake, nothing added
		expect(state().packageItems).toHaveLength(0);
	});

	it('rejects a non-numeric count without touching the database', async () => {
		await runSeeder('abc');

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining('Error in package seeder script:'),
			expect.objectContaining({ message: expect.stringContaining('Invalid count "abc"') })
		);
		expect(process.exitCode).toBe(1);
		expect(state().packages).toHaveLength(0);
	});

	it('rejects a zero count', async () => {
		await runSeeder('0');

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining('Error in package seeder script:'),
			expect.objectContaining({ message: expect.stringContaining('Invalid count "0"') })
		);
		expect(process.exitCode).toBe(1);
		expect(state().packages).toHaveLength(0);
	});
});

describe('packages seeder — cleanup', () => {
	it('removes only FAKE- packages and their join rows', async () => {
		(state().packages as PackageFixture[]).push(
			{ id: 1, name: 'Office Desktop PC' },
			{ id: 2, name: 'Real Bundle' },
			{ id: 3, name: 'FAKE-Gamer PC 001' },
			{ id: 4, name: 'FAKE-Budget Kit 002' }
		);
		(state() as DbState).packageItems.push(
			{
				package_id: 1,
				product_id: 1,
				quantity: 1,
				serial_number: null,
				price: '10000',
				total_price: '10000'
			},
			{
				package_id: 2,
				product_id: 2,
				quantity: 1,
				serial_number: null,
				price: '6500',
				total_price: '6500'
			},
			{
				package_id: 3,
				product_id: 3,
				quantity: 1,
				serial_number: null,
				price: '2800',
				total_price: '2800'
			},
			{
				package_id: 4,
				product_id: 4,
				quantity: 1,
				serial_number: null,
				price: '3200',
				total_price: '3200'
			}
		);
		await runSeeder('cleanup');

		expect(
			state()
				.packages.map((p) => p.id)
				.sort((a, b) => a - b)
		).toEqual([1, 2]);
		expect(
			state()
				.packageItems.map((i) => i.package_id)
				.sort((a, b) => a - b)
		).toEqual([1, 2]);
		expect(logSpy).toHaveBeenCalledWith(
			'Cleaned up — 2 fake packages (curated and real rows untouched)'
		);
	});

	it('is a no-op when no FAKE- packages exist', async () => {
		(state().packages as PackageFixture[]).push({ id: 1, name: 'Office Desktop PC' });
		await runSeeder('cleanup');

		expect(state().packages).toHaveLength(1);
		expect(logSpy).toHaveBeenCalledWith(
			'Cleaned up — 0 fake packages (curated and real rows untouched)'
		);
	});
});
