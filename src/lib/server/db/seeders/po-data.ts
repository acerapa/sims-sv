import { inArray, like, sql } from 'drizzle-orm';
import { db, client } from '..';
import { products, purchaseOrderItems, purchaseOrders, suppliers } from '../schema';

// Bulk fake receive POs for the PO list/print flow. Reuses the data the other seeders
// created (suppliers, products) and coexists with real POs: fake references carry the
// FAKE-PO- prefix so cleanup removes exactly what this script created.
//
// Usage: npm run seed:po [count] — count defaults to DEFAULT_PO_COUNT; npm run seed:po:cleanup
const FAKE_REF_PREFIX = 'FAKE-PO-';
const DEFAULT_PO_COUNT = 8;
const MIN_ITEMS_PER_PO = 1;
const MAX_ITEMS_PER_PO = 4;

const FAKE_NOTES = [
	'Regular restock order',
	'Urgent — main branch running low',
	'Price matched against last quotation',
	'Includes units reserved for the branch project'
];

const randInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(rows: readonly T[]): T => rows[Math.floor(Math.random() * rows.length)];

const twoDecimals = (value: number): string => value.toFixed(2);

const parseCount = (arg: string | undefined): number => {
	if (arg === undefined) return DEFAULT_PO_COUNT;
	const count = Number(arg);
	if (!Number.isInteger(count) || count < 1)
		throw new Error(`Invalid count "${arg}" — usage: npm run seed:po [positive-int]`);
	return count;
};

const randomRecentDate = (): Date => new Date(Date.now() - randInt(0, 60) * 86_400_000);

// fake POs are identified by their reference prefix — items belong to their parent PO
const cleanupPoData = async () => {
	const fakePos = await db
		.select({ id: purchaseOrders.id })
		.from(purchaseOrders)
		.where(like(purchaseOrders.reference, `${FAKE_REF_PREFIX}%`));
	let deletedItems = 0;
	let deletedPos = 0;
	if (fakePos.length > 0) {
		const fakePosIds = fakePos.map((row) => row.id);
		const items = await db
			.delete(purchaseOrderItems)
			.where(inArray(purchaseOrderItems.purchase_order_id, fakePosIds))
			.returning({ product_id: purchaseOrderItems.product_id });
		deletedItems = items.length;
		const pos = await db
			.delete(purchaseOrders)
			.where(inArray(purchaseOrders.id, fakePosIds))
			.returning({ id: purchaseOrders.id });
		deletedPos = pos.length;
	}
	console.log(`Cleaned up — ${deletedPos} fake POs, ${deletedItems} items (real POs untouched)`);
};

const seedPoData = async (requestedCount: number) => {
	// real rows the new records reference
	const [supplierRows, productRows, existingFake, maxPoRow, maxRefRow] = await Promise.all([
		db.select({ id: suppliers.id }).from(suppliers),
		db.select({ id: products.id }).from(products),
		db
			.select({ id: purchaseOrders.id })
			.from(purchaseOrders)
			.where(like(purchaseOrders.reference, `${FAKE_REF_PREFIX}%`))
			.limit(1),
		db.select({ max: sql<number>`coalesce(max(${purchaseOrders.id}), 0)` }).from(purchaseOrders),
		// the reference numbering continues after the highest numeric PO-\d+ suffix
		// already used (regex guard so oddly-formatted real references can't break the cast)
		db
			.select({
				max: sql<number>`coalesce(max(split_part(${purchaseOrders.reference}, '-', 2)::int), 0)`
			})
			.from(purchaseOrders)
			.where(sql`${purchaseOrders.reference} ~ '^PO-[0-9]+$'`)
	]);
	if (supplierRows.length === 0)
		throw new Error('No suppliers found — run npm run seed:suppliers first');
	if (productRows.length === 0)
		throw new Error('No products found — run npm run seed:categories and add products first');
	if (existingFake.length > 0) {
		console.log('Fake PO data already present — run npm run seed:po:cleanup first');
		return;
	}

	// explicit ids: bulk seeders in this repo leave serial sequences behind (see
	// str-data.ts), so DEFAULT ids can collide
	const maxPoId = maxPoRow[0]?.max ?? 0;
	const maxRefNumber = maxRefRow[0]?.max ?? 0;
	const poId = (i: number) => maxPoId + i + 1;
	const refNumber = (i: number) => maxRefNumber + i + 1;

	const productIds = productRows.map((row) => row.id);
	let itemTotal = 0;
	for (let s = 0; s < requestedCount; s++) {
		// one product per PO line — quantities are whole units (no serials on PO items)
		// and capped by the pool size so a fresh DB with a single product still seeds
		const itemCount = Math.min(randInt(MIN_ITEMS_PER_PO, MAX_ITEMS_PER_PO), productIds.length);
		const usedProducts = new Set<number>();
		const lines: {
			product_id: number;
			quantity: number;
			cost: string;
			total_cost: string;
			sale_price: string;
		}[] = [];
		for (let i = 0; i < itemCount; i++) {
			const product_id = pick(productIds.filter((id) => !usedProducts.has(id)));
			usedProducts.add(product_id);
			const quantity = randInt(1, 10);
			// unit cost in the 500–80,000 range with realistic cent digits
			const cost = Number(twoDecimals(randInt(50_000, 8_000_000) / 100));
			const sale_price = Number(twoDecimals(cost * 1.25));
			lines.push({
				product_id,
				quantity,
				cost: twoDecimals(cost),
				total_cost: twoDecimals(cost * quantity),
				sale_price: twoDecimals(sale_price)
			});
		}
		const sub_total = lines.reduce((sum, line) => sum + Number(line.total_cost), 0);
		// a third of the orders carry a small discount — totals stay consistent
		const discount = Math.random() < 1 / 3 ? Number(twoDecimals(sub_total * 0.05)) : 0;
		const total = Number(twoDecimals(sub_total - discount));

		await db.insert(purchaseOrders).values({
			id: poId(s),
			reference: `${FAKE_REF_PREFIX}${String(refNumber(s)).padStart(6, '0')}`,
			supplier_id: pick(supplierRows).id,
			receive_date: randomRecentDate(),
			receive_type: Math.random() < 0.5 ? 'with_pay' : 'without_pay',
			notes: s % 2 === 0 ? pick(FAKE_NOTES) : null,
			sub_total: twoDecimals(sub_total),
			discount: twoDecimals(discount),
			total: twoDecimals(total)
		});
		await db
			.insert(purchaseOrderItems)
			.values(lines.map((line) => ({ ...line, purchase_order_id: poId(s) })));
		itemTotal += lines.length;
	}
	console.log(`PO data seeded — ${requestedCount} POs, ${itemTotal} items`);
};

const main = async () => {
	try {
		if (process.argv[2] === 'cleanup') {
			await cleanupPoData();
		} else {
			await seedPoData(parseCount(process.argv[2]));
		}
	} catch (error) {
		console.error('Error in PO seeder script:', error);
		process.exitCode = 1;
	} finally {
		await client.end();
	}
};

main();
