import { and, asc, count, desc, eq, ilike, ne, sql, sum } from 'drizzle-orm';
import { db } from '..';
import {
	customers,
	invoiceItems,
	invoicePayments,
	invoices,
	products,
	salesOrderItems,
	salesOrders,
	packages
} from '../schema';

export interface CreateInvoiceData {
	sales_order_id: number;
	invoice_date: Date;
	due_date: Date;
	notes?: string;
	total_amount: number;
	items: {
		sales_order_item_id: number;
		product_id?: number | null;
		package_id?: number | null;
		quantity: number;
		unit_price: number;
		total_price: number;
	}[];
}

export interface CreatePaymentData {
	invoice_id: number;
	payment_date: Date;
	amount: number;
	payment_type: string;
	check_number?: string;
	reference_number?: string;
	notes?: string;
}

export const createInvoice = async (data: CreateInvoiceData) => {
	return await db.transaction(async (tx) => {
		const [invoice] = await tx
			.insert(invoices)
			.values(
				Object({
					sales_order_id: data.sales_order_id,
					invoice_date: data.invoice_date,
					due_date: data.due_date,
					notes: data.notes,
					total_amount: data.total_amount
				})
			)
			.returning({ lastInsertedId: invoices.id });

		const rows = data.items.map((item) => {
			const pid = item.product_id ?? null; // validated upstream as number | null | undefined
			const pkg = item.package_id ?? null;
			return Object({
				invoice_id: invoice.lastInsertedId,
				sales_order_item_id: item.sales_order_item_id,
				product_id: pid,
				package_id: pkg,
				quantity: item.quantity,
				unit_price: item.unit_price,
				total_price: item.total_price
			});
		});

		await tx.insert(invoiceItems).values(rows);

		// Update sales order status based on invoiced quantities
		await updateSalesOrderStatus(tx, data.sales_order_id);

		return invoice;
	});
};

export const createPayment = async (data: CreatePaymentData) => {
	return await db.transaction(async (tx) => {
		const [payment] = await tx
			.insert(invoicePayments)
			.values(Object(data))
			.returning({ lastInsertedId: invoicePayments.id });

		// Update invoice paid_amount and status
		const payments = await tx
			.select({ total: sum(invoicePayments.amount) })
			.from(invoicePayments)
			.where(eq(invoicePayments.invoice_id, data.invoice_id));

		const totalPaid = parseFloat(payments[0]?.total || '0');

		const [inv] = await tx
			.select({ total_amount: invoices.total_amount, sales_order_id: invoices.sales_order_id })
			.from(invoices)
			.where(eq(invoices.id, data.invoice_id));

		const totalAmount = parseFloat(inv.total_amount as string);
		const invoiceStatus = totalPaid >= totalAmount ? 'paid' : 'partially_paid';

		await tx
			.update(invoices)
			.set({
				paid_amount: totalPaid.toString(),
				invoice_status: invoiceStatus
			})
			.where(eq(invoices.id, data.invoice_id));

		// Update sales order status
		await updateSalesOrderStatus(tx, inv.sales_order_id);

		return payment;
	});
};

const updateSalesOrderStatus = async (
	tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
	salesOrderId: number
) => {
	// Get all sales order items with their total invoiced quantities
	const orderItems = await tx
		.select({
			id: salesOrderItems.id,
			quantity: salesOrderItems.quantity
		})
		.from(salesOrderItems)
		.where(eq(salesOrderItems.sales_order_id, salesOrderId));

	const invoicedQuantities = await tx
		.select({
			sales_order_item_id: invoiceItems.sales_order_item_id,
			total_invoiced: sum(invoiceItems.quantity)
		})
		.from(invoiceItems)
		.innerJoin(invoices, eq(invoiceItems.invoice_id, invoices.id))
		.where(eq(invoices.sales_order_id, salesOrderId))
		.groupBy(invoiceItems.sales_order_item_id);

	let allFullyInvoiced = true;
	let anyInvoiced = false;

	for (const item of orderItems) {
		const invoiced = invoicedQuantities.find((iq) => iq.sales_order_item_id === item.id);
		const invoicedQty = parseInt(invoiced?.total_invoiced || '0');

		if (invoicedQty > 0) {
			anyInvoiced = true;
		}
		if (invoicedQty < item.quantity) {
			allFullyInvoiced = false;
		}
	}

	let status: string;
	if (allFullyInvoiced && anyInvoiced) {
		status = 'invoiced';
	} else if (anyInvoiced) {
		status = 'partially_invoiced';
	} else {
		status = 'open';
	}

	await tx
		.update(salesOrders)
		.set({ order_status: status })
		.where(eq(salesOrders.id, salesOrderId));
};

export const getInvoices = async () => {
	const result = await db
		.select({
			id: invoices.id,
			sales_order_id: invoices.sales_order_id,
			customer_name: customers.name,
			invoice_date: invoices.invoice_date,
			due_date: invoices.due_date,
			invoice_status: invoices.invoice_status,
			notes: invoices.notes,
			total_amount: invoices.total_amount,
			paid_amount: invoices.paid_amount,
			created_at: invoices.created_at
		})
		.from(invoices)
		.innerJoin(salesOrders, eq(invoices.sales_order_id, salesOrders.id))
		.innerJoin(customers, eq(salesOrders.customer_id, customers.id))
		.orderBy(desc(invoices.created_at));

	return result;
};

export const getPaginatedInvoices = async (page: number, limit: number) => {
	const offset = (page - 1) * limit;

	const [{ total }] = await db.select({ total: count() }).from(invoices);

	const result = await db
		.select({
			id: invoices.id,
			sales_order_id: invoices.sales_order_id,
			customer_name: customers.name,
			invoice_date: invoices.invoice_date,
			due_date: invoices.due_date,
			invoice_status: invoices.invoice_status,
			notes: invoices.notes,
			total_amount: invoices.total_amount,
			paid_amount: invoices.paid_amount,
			created_at: invoices.created_at
		})
		.from(invoices)
		.innerJoin(salesOrders, eq(invoices.sales_order_id, salesOrders.id))
		.innerJoin(customers, eq(salesOrders.customer_id, customers.id))
		.orderBy(desc(invoices.created_at))
		.offset(offset)
		.limit(limit);

	return {
		data: result,
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit)
	};
};

export const getInvoice = async (invoiceId: number) => {
	const [invoice] = await db
		.select({
			id: invoices.id,
			sales_order_id: invoices.sales_order_id,
			customer_name: customers.name,
			invoice_date: invoices.invoice_date,
			due_date: invoices.due_date,
			invoice_status: invoices.invoice_status,
			notes: invoices.notes,
			total_amount: invoices.total_amount,
			paid_amount: invoices.paid_amount,
			created_at: invoices.created_at
		})
		.from(invoices)
		.innerJoin(salesOrders, eq(invoices.sales_order_id, salesOrders.id))
		.innerJoin(customers, eq(salesOrders.customer_id, customers.id))
		.where(eq(invoices.id, invoiceId));

	if (!invoice) {
		throw new Error(`Invoice with ID ${invoiceId} not found`);
	}

	const items = await db
		.select({
			id: invoiceItems.id,
			sales_order_item_id: invoiceItems.sales_order_item_id,
			product_id: invoiceItems.product_id,
			product_name: products.sales_description,
			package_id: invoiceItems.package_id,
			package_name: packages.name,
			quantity: invoiceItems.quantity,
			unit_price: invoiceItems.unit_price,
			total_price: invoiceItems.total_price
		})
		.from(invoiceItems)
		.leftJoin(products, eq(invoiceItems.product_id, products.id))
		.leftJoin(packages, eq(invoiceItems.package_id, packages.id))
		.where(eq(invoiceItems.invoice_id, invoiceId));

	const payments = await db
		.select({
			id: invoicePayments.id,
			payment_date: invoicePayments.payment_date,
			amount: invoicePayments.amount,
			payment_type: invoicePayments.payment_type,
			check_number: invoicePayments.check_number,
			reference_number: invoicePayments.reference_number,
			notes: invoicePayments.notes
		})
		.from(invoicePayments)
		.where(eq(invoicePayments.invoice_id, invoiceId))
		.orderBy(desc(invoicePayments.payment_date));

	return { ...invoice, items, payments };
};

/** Customer Bills ledger: every non-cancelled bill (invoice) with its outstanding balance. */
export interface CustomerBillRow {
	id: number;
	customer_name: string;
	sales_order_id: number;
	invoice_date: Date;
	due_date: Date;
	invoice_status: 'cancelled' | 'paid' | 'unpaid' | 'partially_paid' | null;
	total_amount: string;
	paid_amount: string | null;
	balance: number;
}

export type CustomerBillStatusFilter = 'unpaid' | 'partially_paid' | 'paid';

export interface GetPaginatedCustomerBillsParams {
	page: number;
	limit: number;
	search?: string;
	status?: CustomerBillStatusFilter;
}

/**
 * Customer Bills ledger: every non-cancelled bill (invoice) with its outstanding balance,
 * paginated with an optional customer-name search and status filter. The outstanding
 * summary always covers the full ledger (all open bills), so the header badge does not
 * change with the current page or filters.
 */
export const getPaginatedCustomerBills = async (
	params: GetPaginatedCustomerBillsParams
): Promise<{
	data: CustomerBillRow[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
	outstanding: { count: number; total: number };
}> => {
	const { page, limit, search = '', status } = params;
	const offset = (page - 1) * limit;

	const where = and(
		ne(invoices.invoice_status, 'cancelled'),
		search ? ilike(customers.name, `%${search}%`) : undefined,
		status ? eq(invoices.invoice_status, status) : undefined
	);

	const [{ total }] = await db
		.select({ total: count() })
		.from(invoices)
		.innerJoin(salesOrders, eq(invoices.sales_order_id, salesOrders.id))
		.innerJoin(customers, eq(salesOrders.customer_id, customers.id))
		.where(where);

	const rows = await db
		.select({
			id: invoices.id,
			customer_name: customers.name,
			sales_order_id: invoices.sales_order_id,
			invoice_date: invoices.invoice_date,
			due_date: invoices.due_date,
			invoice_status: invoices.invoice_status,
			total_amount: invoices.total_amount,
			paid_amount: invoices.paid_amount
		})
		.from(invoices)
		.innerJoin(salesOrders, eq(invoices.sales_order_id, salesOrders.id))
		.innerJoin(customers, eq(salesOrders.customer_id, customers.id))
		.where(where)
		.orderBy(asc(invoices.due_date), asc(invoices.id))
		.offset(offset)
		.limit(limit);

	const data: CustomerBillRow[] = rows.map((row) => ({
		...row,
		balance: Math.max(0, parseFloat(row.total_amount) - parseFloat(row.paid_amount as string))
	})); // never negative — an overpaid invoice shows 0 due

	// what is still receivable on the whole ledger: open bills, balance clamped to 0
	const [{ outstandingCount, outstandingTotal }] = await db
		.select({
			outstandingCount: sql<number>`count(${invoices.id})::int`,
			outstandingTotal: sql<number>`coalesce(
				sum(greatest(${invoices.total_amount}::numeric - coalesce(${invoices.paid_amount}::numeric, 0), 0)),
				0
			)`
		})
		.from(invoices)
		.where(and(ne(invoices.invoice_status, 'cancelled'), ne(invoices.invoice_status, 'paid')));

	return {
		data,
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit),
		outstanding: { count: outstandingCount, total: Number(outstandingTotal) }
	};
};

export const getSalesOrderForInvoice = async (salesOrderId: number) => {
	const [order] = await db
		.select({
			id: salesOrders.id,
			customer_id: salesOrders.customer_id,
			customer_name: customers.name,
			date_ordered: salesOrders.date_ordered,
			order_type: salesOrders.order_type,
			order_status: salesOrders.order_status,
			total_cost: salesOrders.total_cost,
			notes: salesOrders.notes
		})
		.from(salesOrders)
		.innerJoin(customers, eq(salesOrders.customer_id, customers.id))
		.where(eq(salesOrders.id, salesOrderId));

	if (!order) {
		throw new Error(`Sales order with ID ${salesOrderId} not found`);
	}

	// Get order items with their invoiced quantities
	const items = await db
		.select({
			id: salesOrderItems.id,
			product_id: salesOrderItems.product_id,
			product_name: products.sales_description,
			package_id: salesOrderItems.package_id,
			package_name: packages.name,
			quantity: salesOrderItems.quantity,
			unit_price: salesOrderItems.unit_price,
			total_price: salesOrderItems.total_price,
			invoiced_quantity: sql<number>`COALESCE((
				SELECT SUM(ii.quantity) FROM invoice_items ii
				INNER JOIN invoices inv ON ii.invoice_id = inv.id
				WHERE ii.sales_order_item_id = ${salesOrderItems.id}
				AND inv.invoice_status != 'cancelled'
			), 0)`
		})
		.from(salesOrderItems)
		.leftJoin(products, eq(salesOrderItems.product_id, products.id))
		.leftJoin(packages, eq(salesOrderItems.package_id, packages.id))
		.where(eq(salesOrderItems.sales_order_id, salesOrderId));

	return { ...order, items };
};
