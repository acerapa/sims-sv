import { asc, inArray, like, sql } from 'drizzle-orm';
import { db, client } from '..';
import { physicalInventoryItems, physicalInventories, products, users } from '../schema';

// Bulk fake physical inventories for the vendors/physical-inventory list/detail/print
// flows — mirrors the fix-assets pattern: identifiable rows (FAKE- titles), fail-fast
// on missing deps, and a cleanup mode that deletes exactly what this script created.
// Real products are reused — no fake products are created. Counts are seeded so the
// rows read like a real count: system_count is the product's current stock,
// actual_count drifts by a few units (floored at 0), and difference = actual − system
// — the same convention the detail page computes.
//
// Usage: npm run seed:physical-inventory [count] — count defaults to
// DEFAULT_INVENTORY_COUNT; npm run seed:physical-inventory:cleanup
const FAKE_TITLE_PREFIX = 'FAKE-';
const DEFAULT_INVENTORY_COUNT = 10;
const MIN_ITEMS_PER_INVENTORY = 2;
const MAX_ITEMS_PER_INVENTORY = 6;
const MAX_COUNT_DRIFT = 3;

// title parts for generated inventories — the sequence number in the title keeps them unique
const NAME_A = ['Cycle', 'Quarterly', 'Year-End', 'Opening', 'Spot', 'Full'];
const NAME_B = ['Count', 'Stocktake', 'Inventory'];
const FAKE_NOTES = [
	'Quarterly stock verification',
	'Pre-audit floor count',
	'Cycle count of fast-moving items',
	'End-of-month reconciliation',
	'Count after branch restock'
];

const randInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(rows: readonly T[]): T => rows[Math.floor(Math.random() * rows.length)];

const parseCount = (arg: string | undefined): number => {
	if (arg === undefined) return DEFAULT_INVENTORY_COUNT;
	const count = Number(arg);
	if (!Number.isInteger(count) || count < 1)
		throw new Error(
			`Invalid count "${arg}" — usage: npm run seed:physical-inventory [positive-int]`
		);
	return count;
};

const idRange = (max: number, count: number): number[] =>
	Array.from({ length: count }, (_, i) => max + i + 1);

const randomRecentDate = (): Date => new Date(Date.now() - randInt(0, 60) * 86_400_000);

const makeFakeInventory = (
	seq: number,
	finalized: boolean
): {
	title: string;
	notes: string;
	status: 'draft' | 'finalized';
	date_finalized: Date | null;
} => ({
	title: `${FAKE_TITLE_PREFIX}${pick(NAME_A)} ${pick(NAME_B)} ${String(seq).padStart(3, '0')}`,
	notes: pick(FAKE_NOTES),
	status: finalized ? 'finalized' : 'draft',
	date_finalized: finalized ? randomRecentDate() : null
});

const cleanupInventoryData = async () => {
	const fakeInventories = await db
		.select({ id: physicalInventories.id })
		.from(physicalInventories)
		.where(like(physicalInventories.title, `${FAKE_TITLE_PREFIX}%`));
	const fakeIds = fakeInventories.map((row) => row.id);
	if (fakeIds.length > 0) {
		// items first — they hold the foreign keys to the inventory rows
		await db
			.delete(physicalInventoryItems)
			.where(inArray(physicalInventoryItems.physical_inventory_id, fakeIds));
		await db.delete(physicalInventories).where(inArray(physicalInventories.id, fakeIds));
	}
	console.log(
		`Cleaned up — ${fakeIds.length} fake inventories and their items (real rows untouched)`
	);
};

const seedInventoryData = async (requestedCount: number) => {
	// real rows the foreign keys must point at
	const [userRows, productRows, existingFake, maxInventoryRow, maxItemRow] = await Promise.all([
		db.select({ id: users.id }).from(users),
		db
			.select({ id: products.id, quantity: products.quantity })
			.from(products)
			.orderBy(asc(products.id)),
		db
			.select({ id: physicalInventories.id })
			.from(physicalInventories)
			.where(like(physicalInventories.title, `${FAKE_TITLE_PREFIX}%`))
			.limit(1),
		db
			.select({ max: sql<number>`coalesce(max(${physicalInventories.id}), 0)` })
			.from(physicalInventories),
		db
			.select({ max: sql<number>`coalesce(max(${physicalInventoryItems.id}), 0)` })
			.from(physicalInventoryItems)
	]);
	if (userRows.length === 0) throw new Error('No users found — run npm run seed:admin-user first');
	if (productRows.length === 0)
		throw new Error('No products found — run npm run seed:fake-data or seed:str first');
	if (productRows.length < MAX_ITEMS_PER_INVENTORY)
		throw new Error(
			`Need at least ${MAX_ITEMS_PER_INVENTORY} distinct products — run npm run seed:fake-data or seed:str first`
		);
	if (existingFake.length > 0) {
		console.log(
			'Fake inventory data already present — run npm run seed:physical-inventory:cleanup first'
		);
		return;
	}

	// explicit ids: bulk seeders in this repo leave serial sequences behind (see
	// str-data.ts), so DEFAULT ids can collide
	const inventoryIds = idRange(maxInventoryRow[0]?.max ?? 0, requestedCount);
	const itemIds = idRange(maxItemRow[0]?.max ?? 0, requestedCount * MAX_ITEMS_PER_INVENTORY + 100);
	let nextItemId = 0;
	let itemTotal = 0;

	for (let f = 0; f < requestedCount; f++) {
		const fake = makeFakeInventory(f + 1, f % 3 === 0);
		await db.insert(physicalInventories).values({
			id: inventoryIds[f],
			...fake,
			created_by: pick(userRows).id
		});

		const usedProductIds = new Set<number>();
		const itemCount = randInt(MIN_ITEMS_PER_INVENTORY, MAX_ITEMS_PER_INVENTORY);
		for (let i = 0; i < itemCount; i++) {
			const product = pick(productRows.filter((row) => !usedProductIds.has(row.id)));
			usedProductIds.add(product.id);
			const systemCount = product.quantity ?? 0;
			const actualCount = Math.max(0, systemCount + randInt(-MAX_COUNT_DRIFT, MAX_COUNT_DRIFT));
			await db.insert(physicalInventoryItems).values({
				id: itemIds[nextItemId++],
				physical_inventory_id: inventoryIds[f],
				product_id: product.id,
				system_count: systemCount,
				actual_count: actualCount,
				difference: actualCount - systemCount
			});
			itemTotal++;
		}
	}
	console.log(`Physical inventories seeded — ${requestedCount} inventories, ${itemTotal} items`);
};

const main = async () => {
	try {
		if (process.argv[2] === 'cleanup') {
			await cleanupInventoryData();
		} else {
			await seedInventoryData(parseCount(process.argv[2]));
		}
	} catch (error) {
		console.error('Error in physical inventory seeder script:', error);
		process.exitCode = 1;
	} finally {
		await client.end();
	}
};

main();
