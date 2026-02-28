import { getCustomers } from '$lib/server/db/queries/customers';
import { getProducts } from '$lib/server/db/queries/products';
import { createSalesOrder, type CreateSalesOrder } from '$lib/server/db/queries/sales-orders';
import { fail } from '@sveltejs/kit';
import { decode } from 'decode-formdata';
import z from 'zod';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const customers = await getCustomers();
	const products = await getProducts();
	return { customers, products };
};

export const actions: Actions = {
	createSalesOrder: async ({ request, locals }) => {
		try {
			const body = await request.formData();
			const formValues = decode(body, {
				arrays: ['products'],
				numbers: [
					'total_cost',
					'customer_id',
					'products.$.quantity',
					'products.$.product_id',
					'products.$.unit_price',
					'products.$.total_price'
				],
				dates: ['date_ordered']
			}) as CreateSalesOrder;

			if (!locals.user) {
				return fail(401, { message: 'Unauthorized' });
			}

			formValues.staff_user_id = locals.user.id;

			const salesOrderSchema = z.object({
				customer_id: z.number('Customer is required'),
				date_ordered: z.date('Order date is required'),
				order_type: z.enum(['onetime', 'installment'], 'Must be either "onetime" or "installment"'),
				notes: z.string().optional(),
				products: z
					.array(
						z.object({
							product_id: z.number('Product is required'),
							quantity: z.number('Quantity is required').min(1, 'Quantity must be at least 1'),
							unit_price: z.number('Unit price is required'),
							total_price: z.number('Total price is required')
						})
					)
					.min(1, 'At least one product is required')
			});

			const { success, error } = salesOrderSchema.safeParse(formValues);

			if (!success) {
				return fail(400, {
					message: 'Invalid data!',
					errors: z.treeifyError(error),
					issues: error.issues
				});
			}

			return await createSalesOrder(formValues);
		} catch (error) {
			return fail(500, {
				message: 'An error occurred while processing the form',
				error: (error as Error).message
			});
		}
	}
};
