import { eq, inArray, like, sql } from 'drizzle-orm';
import { db, client } from '..';
import { fixAssetItems, fixAssets, products, users } from '../schema';
import { FixAssetUser } from '#lib/const.ts';

// Bulk fake fix-asset transfers for the fix-assets list/print flow — mirrors the
// str-data pattern: identifiable rows (FAKE-FX-SN- serials), fail-fast on missing
// deps, and a cleanup mode that deletes exactly what this script created (fix assets
// are only deleted when all of their items were fake). Real products are reused —
// no fake products are created.
//
// Usage: npm run seed:fix-assets [count] — count defaults to DEFAULT_FIX_ASSET_COUNT;
// npm run seed:fix-assets:cleanup
const FAKE_SERIAL_PREFIX = 'FAKE-FX-SN-';
const DEFAULT_FIX_ASSET_COUNT = 10;
const MIN_ITEMS_PER_FIX_ASSET = 2;
const MAX_ITEMS_PER_FIX_ASSET = 5;

const FAKE_NOTES = [
	'Hardware reallocated to IT support',
	'Retired unit moved to spare-stock holding',
	'New branch setup allocation',
	'Customer return unit reassigned after inspection'
];

const randInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(rows: readonly T[]): T => rows[Math.floor(Math.random() * rows.length)];

const parseCount = (arg: string | undefined): number => {
	if (arg === undefined) return DEFAULT_FIX_ASSET_COUNT;
	const count = Number(arg);
	if (!Number.isInteger(count) || count < 1)
		throw new Error(`Invalid count "${arg}" — usage: npm run seed:fix-assets [positive-int]`);
	return count;
};

const randomRecentDate = (): Date => new Date(Date.now() - randInt(0, 60) * 86_400_000);

const cleanupFixAssetData = async () => {
	const fakeItems = await db
		.select({ id: fixAssetItems.id, fix_asset_id: fixAssetItems.fix_asset_id })
		.from(fixAssetItems)
		.where(like(fixAssetItems.serial_number, `${FAKE_SERIAL_PREFIX}%`));

	let deletedFixAssets = 0;
	if (fakeItems.length > 0) {
		const fakeItemIds = fakeItems.map((item) => item.id);
		const affectedFixAssetIds = [...new Set(fakeItems.map((item) => item.fix_asset_id))];
		await db.delete(fixAssetItems).where(inArray(fixAssetItems.id, fakeItemIds));
		// only fix assets left without any items (protects ones the user extended with real items)
		const emptyFixAssetIds = (
			await db
				.select({ id: fixAssets.id })
				.from(fixAssets)
				.leftJoin(fixAssetItems, eq(fixAssetItems.fix_asset_id, fixAssets.id))
				.where(inArray(fixAssets.id, affectedFixAssetIds))
				.groupBy(fixAssets.id)
				.having(sql`count(${fixAssetItems.id}) = 0`)
		).map((row) => row.id);
		if (emptyFixAssetIds.length > 0) {
			await db.delete(fixAssets).where(inArray(fixAssets.id, emptyFixAssetIds));
			deletedFixAssets = emptyFixAssetIds.length;
		}
	}
	console.log(
		`Cleaned up — ${fakeItems.length} fake items, ${deletedFixAssets} fake fix assets ` +
			`(fix assets deleted only when fully fake)`
	);
};

const seedFixAssetData = async (requestedCount: number) => {
	// real rows the foreign keys must point at
	const [userRows, productRows, existingFake, maxFixAssetRow, maxItemRow] = await Promise.all([
		db.select({ id: users.id }).from(users),
		db.select({ id: products.id, cost: products.cost }).from(products),
		db
			.select({ id: fixAssetItems.id })
			.from(fixAssetItems)
			.where(like(fixAssetItems.serial_number, `${FAKE_SERIAL_PREFIX}%`))
			.limit(1),
		db.select({ max: sql<number>`coalesce(max(${fixAssets.id}), 0)` }).from(fixAssets),
		db.select({ max: sql<number>`coalesce(max(${fixAssetItems.id}), 0)` }).from(fixAssetItems)
	]);
	if (userRows.length === 0) throw new Error('No users found — run npm run seed:admin-user first');
	if (productRows.length === 0)
		throw new Error('No products found — run npm run seed:fake-data or seed:str first');
	if (productRows.length < MAX_ITEMS_PER_FIX_ASSET)
		throw new Error(
			`Need at least ${MAX_ITEMS_PER_FIX_ASSET} distinct products — run npm run seed:fake-data or seed:str first`
		);
	if (existingFake.length > 0) {
		console.log('Fake fix asset data already present — run npm run seed:fix-assets:cleanup first');
		return;
	}

	// explicit ids: the sequences can lag behind explicit-id bulk inserts from the other
	// seeders, so DEFAULT ids would collide
	const idRange = (max: number, count: number) =>
		Array.from({ length: count }, (_, i) => max + i + 1);
	const fixAssetIds = idRange(maxFixAssetRow[0]?.max ?? 0, requestedCount);
	const itemIds = idRange(maxItemRow[0]?.max ?? 0, requestedCount * MAX_ITEMS_PER_FIX_ASSET + 100);
	let nextItemId = 0;

	let itemTotal = 0;
	for (let f = 0; f < requestedCount; f++) {
		await db.insert(fixAssets).values({
			id: fixAssetIds[f],
			date_transfered: randomRecentDate(),
			notes: f % 2 === 0 ? pick(FAKE_NOTES) : null,
			user: pick(Object.values(FixAssetUser)),
			staff_user_id: pick(userRows).id
		});

		const usedProducts = new Set<number>();
		const itemCount = randInt(MIN_ITEMS_PER_FIX_ASSET, MAX_ITEMS_PER_FIX_ASSET);
		for (let i = 0; i < itemCount; i++) {
			const product = pick(productRows.filter((row) => !usedProducts.has(row.id)));
			usedProducts.add(product.id);
			// one hardware unit per row (qty 1 + serial), same shape the app's list/
			// print flow expects; the cost columns are integer, so round decimal product costs
			const cost = Math.round(product.cost);
			await db.insert(fixAssetItems).values({
				id: itemIds[nextItemId++],
				fix_asset_id: fixAssetIds[f],
				product_id: product.id,
				quantity: 1,
				serial_number: `${FAKE_SERIAL_PREFIX}${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
				cost,
				total_cost: cost
			});
			itemTotal++;
		}
	}
	console.log(`Fix asset data seeded — ${requestedCount} fix assets, ${itemTotal} items`);
};

const main = async () => {
	try {
		if (process.argv[2] === 'cleanup') {
			await cleanupFixAssetData();
		} else {
			await seedFixAssetData(parseCount(process.argv[2]));
		}
	} catch (error) {
		console.error('Error in fix asset seeder script:', error);
		process.exitCode = 1;
	} finally {
		await client.end();
	}
};

main();
