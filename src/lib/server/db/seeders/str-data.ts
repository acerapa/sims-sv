import { eq, inArray, like, sql } from 'drizzle-orm';
import { db, client } from '..';
import { categories, products, stores, strItems, strs } from '../schema';

// Bulk fake stock transfer requests for the STR list/print flow — mirrors the
// fake-sales-data pattern: identifiable rows (FAKE-SKU-STR- products, FAKE-STR-SN-
// serials), fail-fast on missing deps, and a cleanup mode that deletes exactly what
// this script created (STRs are only deleted when all of their items were fake).
//
// Usage: npm run seed:str [count] — count defaults to DEFAULT_STR_COUNT; npm run seed:str:cleanup
const FAKE_SKU_PREFIX = 'FAKE-SKU-STR-';
const FAKE_SERIAL_PREFIX = 'FAKE-STR-SN-';
const PRODUCT_COUNT = 20;
const DEFAULT_STR_COUNT = 15;
const MIN_ITEMS_PER_STR = 2;
const MAX_ITEMS_PER_STR = 4;

// plausible hardware for an inter-branch transfer, so list/print rows read like real ones
const FAKE_NAMES = [
	'Intel Core i5-12400F Processor',
	'Gigabyte B660M DS3H Motherboard',
	'Corsair Vengeance 16GB DDR4 3200',
	'Samsung 980 512GB NVMe SSD',
	'Seagate Barracuda 1TB HDD',
	'ASUS GT1030 2GB Graphics Card',
	'Cooler Master MWE 500W PSU',
	'HP LaserJet M111a Printer',
	'Epson 250VA UPS',
	'Dell E2420H 24" Monitor',
	'Hikvision 1080p Dome Camera',
	'Dahua 4-Channel DVR',
	'Logitech M235 Wireless Mouse',
	'Philips KB2016 Keyboard',
	'Belkin 7-Outlet Power Strip',
	'Cat6 Ethernet Cable 3m',
	'Toshiba Canvio 2TB External HDD',
	'TP-Link TL-WR840N Router',
	'Antec Performance 3 Fan Kit',
	'SanDisk 128GB MicroSD Card'
];

const FAKE_NOTES = [
	'Branch restocking batch',
	'Unit swap — faulty PSU from walk-in repair',
	'New branch setup allocation',
	'Customer pre-order units moved from main stock'
];

const randInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(rows: readonly T[]): T => rows[Math.floor(Math.random() * rows.length)];

const parseCount = (arg: string | undefined): number => {
	if (arg === undefined) return DEFAULT_STR_COUNT;
	const count = Number(arg);
	if (!Number.isInteger(count) || count < 1)
		throw new Error(`Invalid count "${arg}" — usage: npm run seed:str [positive-int]`);
	return count;
};

const randomRecentDate = (): Date => new Date(Date.now() - randInt(0, 60) * 86_400_000);

const cleanupStrData = async () => {
	const fakeProducts = await db
		.select({ id: products.id })
		.from(products)
		.where(like(products.sku, `${FAKE_SKU_PREFIX}%`));
	const fakeItems = await db
		.select({ id: strItems.id, str_id: strItems.str_id })
		.from(strItems)
		.where(like(strItems.serial_number, `${FAKE_SERIAL_PREFIX}%`));

	let deletedStrs = 0;
	if (fakeItems.length > 0) {
		const fakeItemIds = fakeItems.map((item) => item.id);
		const affectedStrIds = [...new Set(fakeItems.map((item) => item.str_id))];
		await db.delete(strItems).where(inArray(strItems.id, fakeItemIds));
		// only STRs left without any items (protects STRs the user extended with real items)
		const emptyStrIds = (
			await db
				.select({ id: strs.id })
				.from(strs)
				.leftJoin(strItems, eq(strItems.str_id, strs.id))
				.where(inArray(strs.id, affectedStrIds))
				.groupBy(strs.id)
				.having(sql`count(${strItems.id}) = 0`)
		).map((row) => row.id);
		if (emptyStrIds.length > 0) {
			await db.delete(strs).where(inArray(strs.id, emptyStrIds));
			deletedStrs = emptyStrIds.length;
		}
	}

	if (fakeProducts.length > 0) {
		await db.delete(products).where(like(products.sku, `${FAKE_SKU_PREFIX}%`));
	}
	console.log(
		`Cleaned up — ${fakeItems.length} fake items, ${deletedStrs} fake STRs, ` +
			`${fakeProducts.length} fake products (STRs deleted only when fully fake)`
	);
};

const seedStrData = async (requestedCount: number) => {
	// real rows the foreign keys must point at
	const [catRows, storeRows, existingFake, maxProductRow, maxStrRow, maxItemRow] =
		await Promise.all([
			db.select({ id: categories.id }).from(categories),
			db.select({ id: stores.id }).from(stores),
			db
				.select({ id: products.id })
				.from(products)
				.where(like(products.sku, `${FAKE_SKU_PREFIX}%`))
				.limit(1),
			db.select({ max: sql<number>`coalesce(max(${products.id}), 0)` }).from(products),
			db.select({ max: sql<number>`coalesce(max(${strs.id}), 0)` }).from(strs),
			db.select({ max: sql<number>`coalesce(max(${strItems.id}), 0)` }).from(strItems)
		]);
	if (catRows.length === 0)
		throw new Error('No categories found — run npm run seed:categories first');
	if (storeRows.length === 0) throw new Error('No stores found — run npm run seed:stores first');
	if (existingFake.length > 0) {
		console.log('Fake STR data already present — run npm run seed:str:cleanup first');
		return;
	}

	// explicit ids: the products sequence can lag behind explicit-id bulk inserts
	// (fake-sales-data does the same), so DEFAULT ids would collide
	const idRange = (max: number, count: number) =>
		Array.from({ length: count }, (_, i) => max + i + 1);
	const productIds = idRange(maxProductRow[0]?.max ?? 0, PRODUCT_COUNT);
	const strIds = idRange(maxStrRow[0]?.max ?? 0, requestedCount);
	const itemIds = idRange(
		maxItemRow[0]?.max ?? 0,
		requestedCount * MAX_ITEMS_PER_STR * 4 + 100 // headroom for the 2–4 serial fan-out
	);
	let nextItemId = 0;

	for (let i = 0; i < PRODUCT_COUNT; i++) {
		await db.insert(products).values({
			id: productIds[i],
			sku: `${FAKE_SKU_PREFIX}${i + 1}`,
			category_id: pick(catRows).id,
			purchase_description: FAKE_NAMES[i],
			sales_description: FAKE_NAMES[i],
			cost: randInt(500, 80_000),
			sale_price: randInt(800, 120_000),
			quantity: randInt(5, 50)
		});
	}

	let itemTotal = 0;
	for (let s = 0; s < requestedCount; s++) {
		await db.insert(strs).values({
			id: strIds[s],
			store_id: pick(storeRows).id,
			transfer_date: randomRecentDate(),
			notes: s % 2 === 0 ? pick(FAKE_NOTES) : null
		});

		const usedProducts = new Set<number>();
		const itemCount = randInt(MIN_ITEMS_PER_STR, MAX_ITEMS_PER_STR);
		for (let i = 0; i < itemCount; i++) {
			// one product per STR item — a multi-serial unit is N rows of qty 1 (same
			// shape the app's createStr/print fan-out expects)
			const product = pick(productIds.filter((id) => !usedProducts.has(id)));
			usedProducts.add(product);
			const cost = randInt(500, 80_000);
			const serialCount = Math.random() < 0.4 ? randInt(2, 4) : 1;
			for (let sn = 0; sn < serialCount; sn++) {
				await db.insert(strItems).values({
					id: itemIds[nextItemId++],
					str_id: strIds[s],
					product_id: product,
					quantity: 1,
					serial_number: `${FAKE_SERIAL_PREFIX}${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
					cost,
					total_cost: cost
				});
				itemTotal++;
			}
		}
	}
	console.log(
		`STR data seeded — ${PRODUCT_COUNT} products, ${requestedCount} STRs, ${itemTotal} items`
	);
};

const main = async () => {
	try {
		if (process.argv[2] === 'cleanup') {
			await cleanupStrData();
		} else {
			await seedStrData(parseCount(process.argv[2]));
		}
	} catch (error) {
		console.error('Error in STR seeder script:', error);
		process.exitCode = 1;
	} finally {
		await client.end();
	}
};

main();
