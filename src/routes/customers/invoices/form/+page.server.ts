import { createInvoice, getSalesOrderForInvoice, type CreateInvoiceData } from '$lib/server/db/queries/invoices';
import { fail, redirect } from '@sveltejs/kit';
import { decode } from 'decode-formdata';
import z from 'zod';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const salesOrderId = url.searchParams.get('sales_order_id');

	if (!salesOrderId) {
		redirect(302, '/customers/sales-orders');
	}

	const salesOrder = await getSalesOrderForInvoice(parseInt(salesOrderId));
	return { salesOrder };
};

export const actions: Actions = {
	createInvoice: async ({ request }) => {
		try {
			const body = await request.formData();
			const formValues = decode(body, {
				arrays: ['items'],
				numbers: [
					'sales_order_id',
					'total_amount',
					'items.$.sales_order_item_id',
					'items.$.product_id',
					'items.$.quantity',
					'items.$.unit_price',
					'items.$.total_price'
				],
				dates: ['invoice_date', 'due_date']
			}) as CreateInvoiceData;

			const invoiceSchema = z.object({
				sales_order_id: z.number('Sales order is required'),
				invoice_date: z.date('Invoice date is required'),
				due_date: z.date('Due date is required'),
				notes: z.string().optional(),
				total_amount: z.number('Total amount is required'),
				items: z
					.array(
						z.object({
							sales_order_item_id: z.number('Sales order item is required'),
							product_id: z.number('Product is required'),
							quantity: z.number('Quantity is required').min(1, 'Quantity must be at least 1'),
							unit_price: z.number('Unit price is required'),
							total_price: z.number('Total price is required')
						})
					)
					.min(1, 'At least one item is required')
			});

			const { success, error } = invoiceSchema.safeParse(formValues);

			if (!success) {
				return fail(400, {
					message: 'Invalid data!',
					errors: z.treeifyError(error),
					issues: error.issues
				});
			}

			return await createInvoice(formValues);
		} catch (error) {
			return fail(500, {
				message: 'An error occurred while processing the form',
				error: (error as Error).message
			});
		}
	}
};
