import { asc, eq, inArray, like, sql } from 'drizzle-orm';
import { db, client } from '..';
import { InvoicePaymentType, SalesChannel, SalesOrderStatus } from '#lib/const.ts';
import {
	customers,
	invoiceItems,
	invoicePayments,
	invoices,
	products,
	salesOrderItems,
	salesOrders,
	users
} from '../schema';

// Bulk fake invoices for the customer invoices, bills ledger, and invoice print flows —
// mirrors the house seeder pattern (fix-assets, str-data): identifiable rows, fail-fast
// on missing deps, and a cleanup mode that deletes exactly what this script created.
// An invoice must reference a sales order and its items (invoice_items.sales_order_item_id
// is a required foreign key), so each fake invoice gets its own sales order, identifiable
// by the FAKE-INV- serials on its order items; cleanup walks the chain back down —
// payments → invoice items → invoices → order items → orders left without any items
// (protects orders the user extended with real items). Real customers/users/products are
// reused — no fake customers, users, or products are created.
//
// Usage: npm run seed:invoices [count] — count defaults to DEFAULT_INVOICE_COUNT;
// npm run seed:invoices:cleanup
const FAKE_SERIAL_PREFIX = 'FAKE-INV-';
const DEFAULT_INVOICE_COUNT = 10;
const MIN_ITEMS_PER_ORDER = 1;
const MAX_ITEMS_PER_ORDER = 3;
const MAX_ITEM_QUANTITY = 5;
const DUE_DAYS = 15;

const FAKE_NOTES = [
	'Customer request — invoiced from standing order',
	'Walk-in hardware sale',
	'Recurring parts order',
	'Quote accepted and invoiced',
	'End-of-month billing run'
];

const randInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(rows: readonly T[]): T => rows[Math.floor(Math.random() * rows.length)];

const parseCount = (arg: string | undefined): number => {
	if (arg === undefined) return DEFAULT_INVOICE_COUNT;
	const count = Number(arg);
	if (!Number.isInteger(count) || count < 1)
		throw new Error(`Invalid count "${arg}" — usage: npm run seed:invoices [positive-int]`);
	return count;
};

const idRange = (max: number, count: number): number[] =>
	Array.from({ length: count }, (_, i) => max + i + 1);

const randomRecentDate = (): Date => new Date(Date.now() - randInt(0, 60) * 86_400_000);

const roundMoney = (amount: number): number => Math.round(amount * 100) / 100;

// one payment per seeded invoice: fully paid, partially paid (25–75%), or unpaid —
// the same paid/status rules the app's createPayment applies
const makePaymentsFor = (
	seq: number,
	total: number
): {
	amount: number;
	payment_type: string;
	check_number: string | null;
	reference_number: string | null;
}[] => {
	const ratio = seq % 3 === 1 ? 1 : seq % 3 === 2 ? randInt(25, 75) / 100 : 0;
	if (ratio === 0) return [];
	const paymentType = pick([
		InvoicePaymentType.CASH,
		InvoicePaymentType.CHECK,
		InvoicePaymentType.BANK_TRANSFER
	]);
	return [
		{
			amount: roundMoney(total * ratio),
			payment_type: paymentType,
			check_number: paymentType === InvoicePaymentType.CHECK ? `CHK-${seq}` : null,
			reference_number: paymentType === InvoicePaymentType.BANK_TRANSFER ? `BTR-${seq}` : null
		}
	];
};

const cleanupInvoiceData = async () => {
	const fakeItems = await db
		.select({ id: salesOrderItems.id, sales_order_id: salesOrderItems.sales_order_id })
		.from(salesOrderItems)
		.where(like(salesOrderItems.serial_number, `${FAKE_SERIAL_PREFIX}%`));
	if (fakeItems.length === 0) {
		console.log('Cleaned up — 0 fake invoices and their chain (real rows untouched)');
		return;
	}

	const fakeItemIds = fakeItems.map((item) => item.id);
	const affectedOrderIds = [...new Set(fakeItems.map((item) => item.sales_order_id))];
	const fakeInvoices = (
		await db
			.select({ invoice_id: invoiceItems.invoice_id })
			.from(invoiceItems)
			.where(inArray(invoiceItems.sales_order_item_id, fakeItemIds))
	).map((row) => row.invoice_id);

	// deletes walk down the foreign keys: payments → invoice items → invoices →
	// order items → orders left without any items
	await db.delete(invoicePayments).where(inArray(invoicePayments.invoice_id, fakeInvoices));
	await db.delete(invoiceItems).where(inArray(invoiceItems.invoice_id, fakeInvoices));
	await db.delete(invoices).where(inArray(invoices.id, fakeInvoices));
	await db.delete(salesOrderItems).where(inArray(salesOrderItems.id, fakeItemIds));
	const emptyOrderIds = (
		await db
			.select({ id: salesOrders.id })
			.from(salesOrders)
			.leftJoin(salesOrderItems, eq(salesOrderItems.sales_order_id, salesOrders.id))
			.where(inArray(salesOrders.id, affectedOrderIds))
			.groupBy(salesOrders.id)
			.having(sql`count(${salesOrderItems.id}) = 0`)
	).map((row) => row.id);
	if (emptyOrderIds.length > 0) {
		await db.delete(salesOrders).where(inArray(salesOrders.id, emptyOrderIds));
	}
	console.log(
		`Cleaned up — ${fakeInvoices.length} fake invoices, ${fakeItems.length} fake order items, ` +
			`${emptyOrderIds.length} fake orders (orders deleted only when fully fake)`
	);
};

const seedInvoiceData = async (requestedCount: number) => {
	// real rows the foreign keys must point at
	const [
		customerRows,
		userRows,
		productRows,
		existingFake,
		maxOrderRow,
		maxOrderItemRow,
		maxInvoiceRow,
		maxInvoiceItemRow,
		maxPaymentRow
	] = await Promise.all([
		db.select({ id: customers.id }).from(customers),
		db.select({ id: users.id }).from(users),
		db
			.select({ id: products.id, sale_price: products.sale_price })
			.from(products)
			.orderBy(asc(products.id)),
		db
			.select({ id: salesOrderItems.id })
			.from(salesOrderItems)
			.where(like(salesOrderItems.serial_number, `${FAKE_SERIAL_PREFIX}%`))
			.limit(1),
		db.select({ max: sql<number>`coalesce(max(${salesOrders.id}), 0)` }).from(salesOrders),
		db.select({ max: sql<number>`coalesce(max(${salesOrderItems.id}), 0)` }).from(salesOrderItems),
		db.select({ max: sql<number>`coalesce(max(${invoices.id}), 0)` }).from(invoices),
		db.select({ max: sql<number>`coalesce(max(${invoiceItems.id}), 0)` }).from(invoiceItems),
		db.select({ max: sql<number>`coalesce(max(${invoicePayments.id}), 0)` }).from(invoicePayments)
	]);
	if (customerRows.length === 0)
		throw new Error('No customers found — run npm run seed:walk-in-customer first');
	if (userRows.length === 0) throw new Error('No users found — run npm run seed:admin-user first');
	if (productRows.length === 0)
		throw new Error('No products found — run npm run seed:fake-data or seed:str first');
	if (productRows.length < MAX_ITEMS_PER_ORDER)
		throw new Error(
			`Need at least ${MAX_ITEMS_PER_ORDER} distinct products — run npm run seed:fake-data or seed:str first`
		);
	if (existingFake.length > 0) {
		console.log('Fake invoice data already present — run npm run seed:invoices:cleanup first');
		return;
	}

	// explicit ids: bulk seeders in this repo leave serial sequences behind (see
	// str-data.ts), so DEFAULT ids can collide
	const orderIds = idRange(maxOrderRow[0]?.max ?? 0, requestedCount);
	const orderItemIds = idRange(
		maxOrderItemRow[0]?.max ?? 0,
		requestedCount * MAX_ITEMS_PER_ORDER + 100
	);
	const invoiceIds = idRange(maxInvoiceRow[0]?.max ?? 0, requestedCount);
	const invoiceItemIds = idRange(
		maxInvoiceItemRow[0]?.max ?? 0,
		requestedCount * MAX_ITEMS_PER_ORDER + 100
	);
	const paymentIds = idRange(maxPaymentRow[0]?.max ?? 0, requestedCount + 50);
	let nextOrderItem = 0;
	let nextInvoiceItem = 0;
	let nextPayment = 0;
	let orderItemTotal = 0;
	let paymentTotal = 0;

	for (let f = 0; f < requestedCount; f++) {
		const seq = String(f + 1).padStart(3, '0');
		const orderDate = randomRecentDate();

		// the order: real customer/staff, priced from the products' sale prices
		const usedProductIds = new Set<number>();
		const itemCount = randInt(MIN_ITEMS_PER_ORDER, MAX_ITEMS_PER_ORDER);
		const orderItems: {
			productId: number;
			quantity: number;
			unitPrice: number;
			totalPrice: number;
		}[] = [];
		for (let i = 0; i < itemCount; i++) {
			const product = pick(productRows.filter((row) => !usedProductIds.has(row.id)));
			usedProductIds.add(product.id);
			const unitPrice = Number(product.sale_price ?? '0');
			const quantity = randInt(1, MAX_ITEM_QUANTITY);
			orderItems.push({
				productId: product.id,
				quantity,
				unitPrice,
				totalPrice: unitPrice * quantity
			});
		}
		const orderTotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
		const orderId = orderIds[f];
		const firstOrderItemId = nextOrderItem;
		await db.insert(salesOrders).values({
			id: orderId,
			customer_id: pick(customerRows).id,
			staff_user_id: pick(userRows).id,
			date_ordered: orderDate,
			order_type: 'onetime',
			order_status: SalesOrderStatus.INVOICED,
			sales_channel: pick([SalesChannel.POS, SalesChannel.MANUAL]),
			total_cost: Math.round(orderTotal)
		});
		for (let i = 0; i < orderItems.length; i++) {
			const item = orderItems[i];
			await db.insert(salesOrderItems).values({
				id: orderItemIds[nextOrderItem++],
				sales_order_id: orderId,
				product_id: item.productId,
				quantity: item.quantity,
				unit_price: String(item.unitPrice),
				total_price: String(item.totalPrice),
				serial_number: `${FAKE_SERIAL_PREFIX}${seq}-${i + 1}`
			});
			orderItemTotal++;
		}

		// the invoice covers the whole order, so the order is fully invoiced
		const invoiceId = invoiceIds[f];
		const invoiceTotal = roundMoney(orderTotal);
		const payments = makePaymentsFor(f + 1, invoiceTotal);
		const paidTotal = roundMoney(payments.reduce((sum, p) => sum + p.amount, 0));
		const invoiceStatus =
			paidTotal >= invoiceTotal ? 'paid' : paidTotal > 0 ? 'partially_paid' : 'unpaid';
		await db.insert(invoices).values({
			id: invoiceId,
			sales_order_id: orderId,
			invoice_date: orderDate,
			due_date: new Date(orderDate.getTime() + DUE_DAYS * 86_400_000),
			invoice_status: invoiceStatus,
			notes: f % 2 === 0 ? pick(FAKE_NOTES) : null,
			total_amount: String(invoiceTotal),
			paid_amount: String(paidTotal)
		});
		for (let i = 0; i < orderItems.length; i++) {
			const item = orderItems[i];
			await db.insert(invoiceItems).values({
				id: invoiceItemIds[nextInvoiceItem++],
				invoice_id: invoiceId,
				sales_order_item_id: orderItemIds[firstOrderItemId + i],
				product_id: item.productId,
				quantity: item.quantity,
				unit_price: String(item.unitPrice),
				total_price: String(item.totalPrice)
			});
		}
		for (const payment of payments) {
			await db.insert(invoicePayments).values({
				id: paymentIds[nextPayment++],
				invoice_id: invoiceId,
				payment_date: orderDate,
				amount: String(payment.amount),
				payment_type: payment.payment_type,
				check_number: payment.check_number,
				reference_number: payment.reference_number
			});
			paymentTotal++;
		}
	}
	console.log(
		`Invoices seeded — ${requestedCount} invoices, ${orderItemTotal} order items, ` +
			`${paymentTotal} payments (each with its own FAKE-INV- sales order)`
	);
};

const main = async () => {
	try {
		if (process.argv[2] === 'cleanup') {
			await cleanupInvoiceData();
		} else {
			await seedInvoiceData(parseCount(process.argv[2]));
		}
	} catch (error) {
		console.error('Error in invoice seeder script:', error);
		process.exitCode = 1;
	} finally {
		await client.end();
	}
};

main();
