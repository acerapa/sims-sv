import { inArray, sql } from 'drizzle-orm';
import { db, client } from '..';
import { ibrrItems, ibrrs, stores, strItems, strs } from '../schema';

// Bulk fake inter-branch receiving reports for the IBRR list/print flow. Deliberately a
// narrow seeder: it only generates IBRR rows and reuses the data the other seeders
// already created (stores, the STRs' products) — an IBRR receives what its linked STR
// sent, so each IBRR mirrors one STR's items aggregated per product.
// Cleanup wipes ALL ibrrs/ibrr_items rows: these tables hold test data only.
//
// Usage: npm run seed:ibrr [count] — count defaults to DEFAULT_IBRR_COUNT and is capped
// by the number of distinct STRs with items (one IBRR per STR); npm run seed:ibrr:cleanup
const DEFAULT_IBRR_COUNT = 8;

const FAKE_NOTES = [
	'Received in full, no damages',
	'One unit shows minor shipping dent',
	'Units verified against the transfer manifest',
	'Arrived with the branch courier'
];

const randInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(rows: readonly T[]): T => rows[Math.floor(Math.random() * rows.length)];

// cleanup removes every row — the tables are test-data only, no markers needed.
// Sequential on purpose: ibrr_items references ibrrs, so the children must go first
const cleanupIbrrData = async () => {
	const items = await db.delete(ibrrItems).returning({ id: ibrrItems.id });
	const reports = await db.delete(ibrrs).returning({ id: ibrrs.id });
	console.log(`Cleaned up — ${items.length} IBRR items, ${reports.length} IBRRs (full wipe)`);
};

const parseCount = (arg: string | undefined): number => {
	if (arg === undefined) return DEFAULT_IBRR_COUNT;
	const count = Number(arg);
	if (!Number.isInteger(count) || count < 1)
		throw new Error(`Invalid count "${arg}" — usage: npm run seed:ibrr [positive-int]`);
	return count;
};

const seedIbrrData = async (requestedCount: number) => {
	// real rows the new records reference: a source store and STRs that carry items
	// (an IBRR mirrors what its linked STR sent)
	const [storeRows, strRows, strIdsWithItems, existingIbrr, maxIbrrRow, maxItemRow] =
		await Promise.all([
			db.select({ id: stores.id, name: stores.name }).from(stores),
			db.select({ id: strs.id, transfer_date: strs.transfer_date }).from(strs),
			db.select({ str_id: strItems.str_id }).from(strItems),
			db.select({ id: ibrrs.id }).from(ibrrs).limit(1),
			db.select({ max: sql<number>`coalesce(max(${ibrrs.id}), 0)` }).from(ibrrs),
			db.select({ max: sql<number>`coalesce(max(${ibrrItems.id}), 0)` }).from(ibrrItems)
		]);
	if (storeRows.length === 0) throw new Error('No stores found — run npm run seed:stores first');
	if (strRows.length === 0) throw new Error('No STRs found — run npm run seed:str first');
	if (strIdsWithItems.length === 0)
		throw new Error('No STR items found — run npm run seed:str first');
	if (existingIbrr.length > 0) {
		console.log('IBRR data already present — run npm run seed:ibrr:cleanup first');
		return;
	}

	// one IBRR per distinct STR (a shipment is received once) — up to the requested count
	const strsWithItems = new Set(strIdsWithItems.map((row) => row.str_id));
	const eligibleStrs = strRows.filter((str) => strsWithItems.has(str.id));
	if (eligibleStrs.length === 0)
		throw new Error('No STRs with items found — run npm run seed:str first');
	if (requestedCount > eligibleStrs.length)
		console.log(`Note — only ${eligibleStrs.length} STRs with items exist, so that is the maximum`);
	const chosenStrs = [...eligibleStrs].sort(() => Math.random() - 0.5).slice(0, requestedCount);

	// the goods an IBRR receives came from the sending branch — the main branch when it
	// is seeded, any store otherwise
	const sourceStore =
		storeRows.find((store) => store.name === 'Calbayog Main Branch') ?? pick(storeRows);

	// explicit ids: bulk seeders in this repo leave serial sequences behind (see
	// str-data.ts), so DEFAULT ids can collide
	const idRange = (max: number, count: number) =>
		Array.from({ length: count }, (_, i) => max + i + 1);
	const ibrrIds = idRange(maxIbrrRow[0]?.max ?? 0, chosenStrs.length);
	const itemIds = idRange(
		maxItemRow[0]?.max ?? 0,
		chosenStrs.length * 10 + 100 // headroom for the mirrored item rows
	);
	let nextItemId = 0;

	let itemTotal = 0;
	for (let i = 0; i < chosenStrs.length; i++) {
		const str = chosenStrs[i];
		const [ibrr] = await db
			.insert(ibrrs)
			.values({
				id: ibrrIds[i],
				str_id: str.id,
				source_store_id: sourceStore.id,
				received_date: new Date(str.transfer_date.getTime() + randInt(1, 7) * 86_400_000),
				notes: i % 2 === 0 ? pick(FAKE_NOTES) : null
			})
			.returning({ id: ibrrs.id });

		// mirror the STR's items aggregated per product — IBRR items carry no serials,
		// so a multi-serial unit lands as one row with quantity = unit count
		const strItemsRows = await db
			.select({
				product_id: strItems.product_id,
				cost: strItems.cost,
				quantity: strItems.quantity
			})
			.from(strItems)
			.where(inArray(strItems.str_id, [str.id]));
		const byProduct = new Map<number, { quantity: number; cost: number }>();
		for (const row of strItemsRows) {
			const agg = byProduct.get(row.product_id) ?? { quantity: 0, cost: row.cost };
			agg.quantity += row.quantity;
			byProduct.set(row.product_id, agg);
		}
		for (const [product_id, agg] of byProduct) {
			await db.insert(ibrrItems).values({
				id: itemIds[nextItemId++],
				ibrr_id: ibrr.id,
				product_id,
				quantity: agg.quantity,
				cost: agg.cost,
				total_cost: agg.cost * agg.quantity
			});
			itemTotal++;
		}
	}
	console.log(
		`IBRR data seeded — ${chosenStrs.length} IBRRs, ${itemTotal} items (mirroring STR data)`
	);
};

const main = async () => {
	try {
		if (process.argv[2] === 'cleanup') {
			await cleanupIbrrData();
		} else {
			await seedIbrrData(parseCount(process.argv[2]));
		}
	} catch (error) {
		console.error('Error in IBRR seeder script:', error);
		process.exitCode = 1;
	} finally {
		await client.end();
	}
};

main();
