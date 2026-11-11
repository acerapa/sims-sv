import { getCustomers } from '#lib/server/db/queries/customers.ts';
import {
	createInvoice,
	createPayment,
	getCustomerBills,
	getInvoice,
	getSalesOrderForInvoice,
	type CreateInvoiceData
} from '#lib/server/db/queries/invoices.ts';
import { getSOsByCustomer } from '#lib/server/db/queries/sales-orders.ts';
import { decode } from 'decode-formdata';
import { fail } from '@sveltejs/kit';
import z from 'zod/v4';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, depends }) => {
	depends('customers:bills');

	const billId = url.searchParams.get('id');
	const bill = billId ? await getInvoice(parseInt(billId)) : null;
	const bills = await getCustomerBills();
	const customers = await getCustomers();

	return { bills, customers, bill };
};

/**
 * A "bill" is a customer invoice. Items are always re-derived from the sales order —
 * the client only picks which SO to bill; fully-invoiced lines are skipped (same rule as
 * the invoice form). An optional first payment is recorded with it.
 * Validation failures (400) are thrown before the DB try/catch so they keep their status.
 */
const createBill = async (request: Request) => {
	const formData = await request.formData();
	const formValues = decode(formData, {
		numbers: ['sales_order_id', 'paid_amount'],
		dates: ['invoice_date', 'due_date']
	});

	const billSchema = z
		.object({
			sales_order_id: z.number('Sales order is required!').min(1, 'Sales order is required!'),
			invoice_date: z.date('Invoice date is required!'),
			due_date: z.date('Due date is required!'),
			notes: z.string().optional(),
			paid_amount: z
				.preprocess(
					(value) => {
						const parsed = value === '' || value == null ? 0 : Number(value);
						return Number.isNaN(parsed) ? 0 : parsed;
					},
					z.number('Paid amount must be a number').min(0, 'Paid amount must be 0 or more')
				)
				.optional(),
			payment_type: z
				.enum(['cash', 'check', 'bank_transfer'], 'Must be cash, check, or bank transfer')
				.optional(),
			check_number: z.string().optional(),
			reference_number: z.string().optional()
		})
		.superRefine((data, ctx) => {
			if ((data.paid_amount ?? 0) > 0 && !data.payment_type) {
				ctx.addIssue({
					code: 'custom',
					message: 'Payment type is required when an amount is paid',
					path: ['payment_type']
				});
			}
			if (data.payment_type === 'check' && !data.check_number) {
				ctx.addIssue({
					code: 'custom',
					message: 'Check number is required for check payments',
					path: ['check_number']
				});
			}
		});

	const { success, error, data } = billSchema.safeParse(formValues);
	if (!success) {
		return fail(400, {
			message: 'Invalid input',
			error: z.treeifyError(error)
		});
	}
	const paidAmount = data.paid_amount ?? 0;

	const salesOrder = await getSalesOrderForInvoice(data.sales_order_id);
	const items: CreateInvoiceData['items'] = [];
	for (const item of salesOrder.items) {
		const remaining = item.quantity - (Number(item.invoiced_quantity) || 0);
		if (remaining <= 0) {
			continue;
		}
		const unitPrice = Number(item.unit_price);
		items.push({
			sales_order_item_id: item.id,
			product_id: item.product_id ?? null,
			package_id: item.package_id ?? null,
			quantity: remaining,
			unit_price: unitPrice,
			total_price: remaining * unitPrice
		});
	}

	if (items.length === 0) {
		return fail(400, { message: 'This sales order is already fully invoiced.' });
	}
	const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);

	let invoice: { lastInsertedId: number };
	try {
		invoice = await createInvoice({
			sales_order_id: data.sales_order_id,
			invoice_date: data.invoice_date,
			due_date: data.due_date,
			notes: data.notes || undefined,
			total_amount: totalAmount,
			items
		});
	} catch (error) {
		console.error(error);
		return fail(500, { message: 'An error occurred while creating the bill' });
	}

	if (paidAmount > 0 && data.payment_type) {
		await createPayment({
			invoice_id: invoice.lastInsertedId,
			payment_date: data.invoice_date,
			amount: paidAmount,
			payment_type: data.payment_type,
			check_number: data.check_number || undefined,
			reference_number: data.reference_number || undefined
		});
	}

	return invoice;
};

export const actions: Actions = {
	createBill: async ({ request }) => {
		return await createBill(request);
	},

	getCustomerRelatedSO: async ({ request }) => {
		const formData = await request.formData();
		const customerId = parseInt(String(formData.get('customer_id') ?? ''));
		if (Number.isNaN(customerId)) {
			return [];
		}
		return await getSOsByCustomer(customerId);
	},

	recordPayment: async ({ request }) => {
		const formData = await request.formData();
		const formValues = decode(formData, {
			numbers: ['invoice_id', 'amount'],
			dates: ['payment_date']
		});

		const paymentSchema = z
			.object({
				invoice_id: z.number('Invoice is required!').min(1, 'Invoice is required!'),
				payment_date: z.date('Payment date is required!'),
				amount: z.number('Amount is required!').min(0.01, 'Amount must be greater than 0'),
				payment_type: z.enum(
					['cash', 'check', 'bank_transfer'],
					'Must be cash, check, or bank transfer'
				),
				check_number: z.string().optional(),
				reference_number: z.string().optional(),
				notes: z.string().optional()
			})
			.superRefine((data, ctx) => {
				if (data.payment_type === 'check' && !data.check_number) {
					ctx.addIssue({
						code: 'custom',
						message: 'Check number is required for check payments',
						path: ['check_number']
					});
				}
			});

		const { success, error, data } = paymentSchema.safeParse(formValues);
		if (!success) {
			return fail(400, {
				message: 'Invalid input',
				error: z.treeifyError(error)
			});
		}

		try {
			return await createPayment(data);
		} catch (err) {
			console.error(err);
			return fail(500, { message: 'An error occurred while recording the payment' });
		}
	}
};
