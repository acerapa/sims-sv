import { getCategories } from '$lib/server/db/queries/categories';
import { getSuppliers } from '$lib/server/db/queries/suppliers';
import { decode } from 'decode-formdata';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import z from 'zod';

export const load: PageServerLoad = async () => {
	const categories = await getCategories();
	return {
		categories: categories,
		suppliers: await getSuppliers()
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		try {
			const body = await request.formData();
			const formvalues = decode(body, {
				arrays: ['suppliers'],
				numbers: [
					'category_id',
					'quantity',
					'minimum_quantity',
					'preferred_supplier_id',
					'sale_price',
					'suppliers.$.supplier_id',
					'suppliers.$.cost'
				]
			});

			const productSchema = z.object({
				sku: z.string('Invalid SKU').min(1, 'SKU is required').max(1000),
				category_id: z.number('Category is required').min(1, 'Category is required'),
				quantity: z.number('Quantity is required').min(0),
				minimum_quantity: z.number('Invalid minimum quantity').default(0),
				sale_price: z.number('Sale price is required').min(0),
				suppliers: z
					.array(
						z.object({
							supplier_id: z.number('Cost is required').min(1),
							cost: z.number('Cost is required').min(0)
						})
					)
					.min(1),
				preferred_supplier_id: z.number().min(1),
				purchase_description: z.string().min(2).max(1000),
				sales_description: z.string().min(2).max(1000)
			});

			const { success, error } = productSchema.safeParse(formvalues);
			if (!success) {
				return fail(400, {
					errors: z.treeifyError(error),
					message: 'Invalid input'
				});
			}

			console.log(formvalues);
		} catch (error) {
			return fail(500, {
				message: 'An error occurred while processing the form',
				error: error
			});
		}
	}
};
