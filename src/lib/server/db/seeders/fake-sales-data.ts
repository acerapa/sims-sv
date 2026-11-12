import { eq, inArray, like, sql } from 'drizzle-orm';
import { seed } from 'drizzle-seed';
import { db, client } from '..';
import { categories, customers, products, salesOrderItems, salesOrders, users } from '../schema';

// Bulk fake data for pagination testing — drizzle-seed generates deterministic rows
// (same SEED_NUMBER → same data). Fake rows are identifiable so cleanup deletes exactly
// what this script created: items carry serial_number 'FAKE', products carry a FAKE-SKU-
// prefix. Orders are only deleted when all of their items were fake.
const FAKE_SKU_PREFIX = 'FAKE-SKU-';
const FAKE_SERIAL = 'FAKE';
const PRODUCT_COUNT = 100;
const ORDER_COUNT = 120;
const ITEMS_PER_ORDER = 2;
const SEED_NUMBER = 1234;

const cleanupFakeData = async () => {
	const fakeProducts = await db
		.select({ id: products.id })
		.from(products)
		.where(like(products.sku, `${FAKE_SKU_PREFIX}%`));
	const fakeItems = await db
		.select({ id: salesOrderItems.id, sales_order_id: salesOrderItems.sales_order_id })
		.from(salesOrderItems)
		.where(sql`${salesOrderItems.serial_number} = ${FAKE_SERIAL}`);

	let deletedOrders = 0;
	if (fakeItems.length > 0) {
		const fakeItemIds = fakeItems.map((item) => item.id);
		const affectedOrderIds = [...new Set(fakeItems.map((item) => item.sales_order_id))];
		await db.delete(salesOrderItems).where(inArray(salesOrderItems.id, fakeItemIds));
		// only orders left without any items (protects orders the user extended with real items)
		const emptyOrderIds = (
			await db
				.select({ id: salesOrders.id })
				.from(salesOrders)
				.leftJoin(salesOrderItems, eq(salesOrderItems.sales_order_id, salesOrders.id))
				.where(inArray(salesOrders.id, affectedOrderIds))
				.groupBy(salesOrders.id)
				.having(sql`count(${salesOrderItems.id}) = 0`)
		).map((order) => order.id);
		if (emptyOrderIds.length > 0) {
			await db.delete(salesOrders).where(inArray(salesOrders.id, emptyOrderIds));
			deletedOrders = emptyOrderIds.length;
		}
	}

	if (fakeProducts.length > 0) {
		await db.delete(products).where(like(products.sku, `${FAKE_SKU_PREFIX}%`));
	}
	console.log(
		`Cleaned up — ${fakeItems.length} fake items, ${deletedOrders} fake orders, ` +
			`${fakeProducts.length} fake products (orders deleted only when fully fake)`
	);
};

const seedFakeSalesData = async () => {
	// real rows the foreign keys must point at
	const [catRows, customerRows, userRows, existingFake, maxProductRow, maxOrderRow, maxItemRow] =
		await Promise.all([
			db.select({ id: categories.id }).from(categories),
			db.select({ id: customers.id }).from(customers),
			db.select({ id: users.id }).from(users),
			db
				.select({ id: products.id })
				.from(products)
				.where(like(products.sku, `${FAKE_SKU_PREFIX}%`))
				.limit(1),
			db.select({ max: sql<number>`coalesce(max(${products.id}), 0)` }).from(products),
			db.select({ max: sql<number>`coalesce(max(${salesOrders.id}), 0)` }).from(salesOrders),
			db.select({ max: sql<number>`coalesce(max(${salesOrderItems.id}), 0)` }).from(salesOrderItems)
		]);
	if (catRows.length === 0) throw new Error('No categories found — run yarn seed:categories first');
	if (customerRows.length === 0)
		throw new Error('No customers found — run yarn seed:walk-in-customer first');
	if (userRows.length === 0) throw new Error('No users found — run yarn seed:admin-user first');
	if (existingFake.length > 0) {
		console.log('Fake data already present — run yarn seed:fake-data:cleanup first');
		return;
	}
	// drizzle-seed emits explicit ids starting at 1, which would collide with existing rows
	// and its relation fill reads the generated ids — so hand it a collision-free range
	const idRange = (max: number, count: number) =>
		Array.from({ length: count }, (_, i) => max + i + 1);
	const productIds = idRange(maxProductRow[0]?.max ?? 0, PRODUCT_COUNT);
	const orderIds = idRange(maxOrderRow[0]?.max ?? 0, ORDER_COUNT);
	const itemIds = idRange(maxItemRow[0]?.max ?? 0, ORDER_COUNT * ITEMS_PER_ORDER + 100);

	await seed(db, { products, salesOrders, salesOrderItems }, { seed: SEED_NUMBER }).refine((f) => ({
		products: {
			count: PRODUCT_COUNT,
			columns: {
				id: f.valuesFromArray({ values: productIds, isUnique: true }),
				sku: f.valuesFromArray({
					values: Array.from({ length: PRODUCT_COUNT }, (_, i) => `${FAKE_SKU_PREFIX}${i + 1}`),
					isUnique: true
				}),
				category_id: f.valuesFromArray({ values: catRows.map((row) => row.id) }),
				purchase_description: f.loremIpsum({ sentencesCount: 2 }),
				sales_description: f.loremIpsum({ sentencesCount: 2 }),
				cost: f.number({ minValue: 500, maxValue: 100000, precision: 2 }),
				sale_price: f.number({ minValue: 800, maxValue: 150000, precision: 2 }),
				quantity: f.int({ minValue: 0, maxValue: 200 })
			}
		},
		salesOrders: {
			count: ORDER_COUNT,
			// items fan out per order — sales_order_id is filled from the generated orders
			with: { salesOrderItems: ITEMS_PER_ORDER },
			columns: {
				id: f.valuesFromArray({ values: orderIds, isUnique: true }),
				customer_id: f.valuesFromArray({ values: customerRows.map((row) => row.id) }),
				staff_user_id: f.valuesFromArray({ values: userRows.map((row) => row.id) }),
				total_cost: f.int({ minValue: 1000, maxValue: 500000 })
			}
		},
		salesOrderItems: {
			columns: {
				id: f.valuesFromArray({
					// +100 headroom in case the child table gets rows beyond the with-count
					values: itemIds,
					isUnique: true
				}),
				serial_number: f.valuesFromArray({ values: [FAKE_SERIAL] }),
				quantity: f.int({ minValue: 1, maxValue: 5 }),
				unit_price: f.number({ minValue: 100, maxValue: 100000, precision: 2 }),
				total_price: f.number({ minValue: 100, maxValue: 500000, precision: 2 })
			}
		}
	}));
	console.log(
		`Fake data seeded — ${PRODUCT_COUNT} products, ${ORDER_COUNT} orders, ` +
			`${ORDER_COUNT * ITEMS_PER_ORDER} order items`
	);
};

const main = async () => {
	try {
		if (process.argv[2] === 'cleanup') {
			await cleanupFakeData();
		} else {
			await seedFakeSalesData();
		}
	} catch (error) {
		console.error('Error in fake sales data script:', error);
		process.exitCode = 1;
	} finally {
		await client.end();
	}
};

main();
