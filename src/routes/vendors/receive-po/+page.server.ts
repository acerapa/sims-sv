import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { decode } from 'decode-formdata';
import z from 'zod';
import { createReceivePO, type CreatePO } from '$lib/server/db/queries/po';
import { getProducts } from '$lib/server/db/queries/products';

export const load: PageServerLoad = async () => {
	const products = await getProducts();
	return { products };
};

export const actions: Actions = {
	receivePo: async ({ request }) => {
		try {
			const body = await request.formData();
			const rawSupplierId = body.get('supplier_id') as string;
			const formValues = decode(body, {
				arrays: ['products'],
				numbers: [
					'sub_total',
					'total',
					'discount',
					'products.$.quantity',
					'products.$.product_id',
					'products.$.cost',
					'products.$.sale_price',
					'products.$.total_cost'
				],
				dates: ['receive_date']
			}) as CreatePO;

			// Only set supplier_id if a valid number was provided
			const supplierId = parseInt(rawSupplierId);
			if (!isNaN(supplierId) && supplierId > 0) {
				formValues.supplier_id = supplierId;
			} else {
				delete formValues.supplier_id;
			}

			const purchaseOrderSchema = z.object({
				reference: z.string('Reference is required').min(1, 'Reference is required'),
				supplier_id: z.number().optional(),
				receive_date: z.date('Receive date is required'),
				receive_type: z.enum(
					['with_pay', 'without_pay'],
					'Must be either "with_pay" or "without_pay"'
				),
				notes: z.string().optional(),
				products: z
					.array(
						z.object({
							product_id: z.number('Product is required'),
							quantity: z.number('Quantity is required').min(1, 'Quantity must be at least 1'),
							cost: z.number('Cost is required'),
							total_cost: z.number('Total cost is required')
						})
					)
					.min(1, 'At least one product is required')
			});

			const { success, error } = purchaseOrderSchema.safeParse(formValues);

			if (!success) {
				return fail(400, {
					message: 'Invalid data!',
					errors: z.treeifyError(error),
					issues: error.issues
				});
			}

			return await createReceivePO(formValues);
		} catch (error) {
			return fail(500, {
				message: 'An error occurred while processing the form',
				error: (error as Error).message
			});
		}
	}
};
