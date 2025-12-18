import { createRMA, getRMAs, type CreateRMAData } from '$lib/server/db/queries/rmas';
import { decode } from 'decode-formdata';
import type { Actions, PageServerLoad } from './$types';
import { getProductsBySupplier } from '$lib/server/db/queries/products';
import z from 'zod';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
	const rmas = await getRMAs();
	let supplierProducts = null;
	const supplierId = url.searchParams.get('supplier_id');

	if (supplierId) {
		supplierProducts = await getProductsBySupplier(parseInt(supplierId));
	}

	return { rmas, supplierProducts };
};

export const actions: Actions = {
	createRMA: async ({ request }) => {
		try {
			const formData = await request.formData();
			const formValues = decode(formData, {
				numbers: [
					'supplier_id',
					'items.$.product_id',
					'items.$.quantity',
					'items.$.cost',
					'items.$.total_cost'
				],
				dates: ['date_returned']
			}) as CreateRMAData;

			const rmaSchema = z.object({
				supplier_id: z.int('Supplier is required!').min(1),
				date_returned: z.date('Returned date is required!'),
				items: z
					.array(
						z.object({
							product_id: z.number('Product is required!').int().positive(),
							quantity: z.number().int().min(1),
							cost: z.number().min(0),
							total_cost: z.number().min(0)
						})
					)
					.min(1)
			});

			const { success, error } = rmaSchema.safeParse(formValues);
			if (!success) {
				return fail(400, {
					errors: z.treeifyError(error),
					message: 'Invalid input'
				});
			}
			console.log(formValues);

			return await createRMA(formValues);
		} catch (error) {
			console.log(error);
			return fail(500, {
				message: 'Internal Server Error'
			});
		}
	}
};
