import { desc, eq, sql, sum } from 'drizzle-orm';
import { db } from '..';
import {
	customers,
	invoiceItems,
	invoicePayments,
	invoices,
	products,
	salesOrderItems,
	salesOrders
} from '../schema';

export interface CreateInvoiceData {
	sales_order_id: number;
	invoice_date: Date;
	due_date: Date;
	notes?: string;
	total_amount: number;
	items: {
		sales_order_item_id: number;
		product_id: number;
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

		await tx.insert(invoiceItems).values(
			data.items.map((item) => {
				return Object({
					invoice_id: invoice.lastInsertedId,
					...item
				});
			})
		);

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

const updateSalesOrderStatus = async (tx: Parameters<Parameters<typeof db.transaction>[0]>[0], salesOrderId: number) => {
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
			quantity: invoiceItems.quantity,
			unit_price: invoiceItems.unit_price,
			total_price: invoiceItems.total_price
		})
		.from(invoiceItems)
		.innerJoin(products, eq(invoiceItems.product_id, products.id))
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
		.innerJoin(products, eq(salesOrderItems.product_id, products.id))
		.where(eq(salesOrderItems.sales_order_id, salesOrderId));

	return { ...order, items };
};
