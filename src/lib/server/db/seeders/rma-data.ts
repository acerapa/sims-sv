import { sql } from 'drizzle-orm';
import { db, client } from '..';
import { products, rmaItems, rmas, suppliers } from '../schema';

// Bulk fake RMAs for the RMA list/print flow. A narrow seeder like ibrr-data: it only
// generates RMA rows and reuses the data the other seeders created (suppliers, products).
// Cleanup wipes ALL rmas/rma_items rows: these tables hold test data only.
//
// Usage: npm run seed:rma [count] — count defaults to DEFAULT_RMA_COUNT; npm run seed:rma:cleanup
const DEFAULT_RMA_COUNT = 8;
const MIN_ITEMS_PER_RMA = 1;
const MAX_ITEMS_PER_RMA = 4;
const FAKE_SERIAL_PREFIX = 'FAKE-RMA-SN-';

const FAKE_NOTES = [
	'Dead-on-arrival unit from the last delivery',
	'No power — suspected PSU fault',
	'Intermittent reboots reported by the branch',
	'Cracked panel found during unboxing'
];

const randInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(rows: readonly T[]): T => rows[Math.floor(Math.random() * rows.length)];

const parseCount = (arg: string | undefined): number => {
	if (arg === undefined) return DEFAULT_RMA_COUNT;
	const count = Number(arg);
	if (!Number.isInteger(count) || count < 1)
		throw new Error(`Invalid count "${arg}" — usage: npm run seed:rma [positive-int]`);
	return count;
};

const randomRecentDate = (): Date => new Date(Date.now() - randInt(0, 60) * 86_400_000);

// cleanup removes every row — the tables are test-data only, no markers needed.
// Sequential on purpose: rma_items references rmas, so the children must go first
const cleanupRmaData = async () => {
	const items = await db.delete(rmaItems).returning({ id: rmaItems.id });
	const reports = await db.delete(rmas).returning({ id: rmas.id });
	console.log(`Cleaned up — ${items.length} RMA items, ${reports.length} RMAs (full wipe)`);
};

const seedRmaData = async (requestedCount: number) => {
	// real rows the new records reference
	const [supplierRows, productRows, existingRma, maxRmaRow, maxItemRow] = await Promise.all([
		db.select({ id: suppliers.id }).from(suppliers),
		db.select({ id: products.id }).from(products),
		db.select({ id: rmas.id }).from(rmas).limit(1),
		db.select({ max: sql<number>`coalesce(max(${rmas.id}), 0)` }).from(rmas),
		db.select({ max: sql<number>`coalesce(max(${rmaItems.id}), 0)` }).from(rmaItems)
	]);
	if (supplierRows.length === 0)
		throw new Error('No suppliers found — run npm run seed:suppliers first');
	if (productRows.length === 0)
		throw new Error('No products found — run npm run seed:categories and add products first');
	if (existingRma.length > 0) {
		console.log('RMA data already present — run npm run seed:rma:cleanup first');
		return;
	}

	// explicit ids: bulk seeders in this repo leave serial sequences behind (see
	// str-data.ts), so DEFAULT ids can collide
	const idRange = (max: number, count: number) =>
		Array.from({ length: count }, (_, i) => max + i + 1);
	const rmaIds = idRange(maxRmaRow[0]?.max ?? 0, requestedCount);
	const itemIds = idRange(
		maxItemRow[0]?.max ?? 0,
		requestedCount * MAX_ITEMS_PER_RMA * 4 + 100 // headroom for the 2–4 serial fan-out
	);
	let nextItemId = 0;

	const productIds = productRows.map((row) => row.id);

	let itemTotal = 0;
	for (let s = 0; s < requestedCount; s++) {
		const [rma] = await db
			.insert(rmas)
			.values({
				id: rmaIds[s],
				supplier_id: pick(supplierRows).id,
				date_returned: randomRecentDate(),
				notes: s % 2 === 0 ? pick(FAKE_NOTES) : null
			})
			.returning({ id: rmas.id });

		const usedProducts = new Set<number>();
		// one product per RMA item — capped by the pool size so a fresh DB with a single
		// product still seeds instead of picking from an empty filter
		const itemCount = Math.min(randInt(MIN_ITEMS_PER_RMA, MAX_ITEMS_PER_RMA), productIds.length);
		for (let i = 0; i < itemCount; i++) {
			// one product per RMA item
			const product = pick(productIds.filter((id) => !usedProducts.has(id)));
			usedProducts.add(product);
			const cost = randInt(500, 80_000);
			// a multi-serial unit is N rows of qty 1 (same shape the app's RMA list/print
			// expects); a single unit may or may not carry a serial
			const serialCount = Math.random() < 0.4 ? randInt(2, 4) : 1;
			const hasSerial = serialCount > 1 || Math.random() < 0.5;
			for (let sn = 0; sn < serialCount; sn++) {
				await db.insert(rmaItems).values({
					id: itemIds[nextItemId++],
					rma_id: rma.id,
					product_id: product,
					quantity: 1,
					serial_number: hasSerial
						? `${FAKE_SERIAL_PREFIX}${Math.random().toString(36).slice(2, 10).toUpperCase()}`
						: null,
					cost,
					total_cost: cost
				});
				itemTotal++;
			}
		}
	}
	console.log(`RMA data seeded — ${requestedCount} RMAs, ${itemTotal} items`);
};

const main = async () => {
	try {
		if (process.argv[2] === 'cleanup') {
			await cleanupRmaData();
		} else {
			await seedRmaData(parseCount(process.argv[2]));
		}
	} catch (error) {
		console.error('Error in RMA seeder script:', error);
		process.exitCode = 1;
	} finally {
		await client.end();
	}
};

main();
