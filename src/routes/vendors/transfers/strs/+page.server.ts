import { decode } from 'decode-formdata';
import type { Actions, PageServerLoad } from './$types';
import { z } from 'zod';
import { fail } from '@sveltejs/kit';
import { createStr, getStrs, type CreateSTRData } from '$lib/server/db/queries/strs';

export const load: PageServerLoad = async ({ depends }) => {
	depends('transfers:strs');
	const strs = await getStrs();
	return { strs };
};

export const actions: Actions = {
	createStr: async ({ request }) => {
		try {
			const body = await request.formData();
			const formvalues = decode(body, {
				numbers: [
					'store_id',
					'items.$.product_id',
					'items.$.quantity',
					'items.$.cost',
					'items.$.total_cost'
				],
				dates: ['transfer_date']
			}) as CreateSTRData;

			// can you add validation here using zod similar to what we did in the products page
			const strSchema = z.object({
				store_id: z.number('Store is required!').int().positive(),
				transfer_date: z.date('transfer_date is required!'),
				notes: z.string().optional(),
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

			const { success, error } = strSchema.safeParse(formvalues);
			if (!success) {
				return fail(400, {
					errors: z.treeifyError(error),
					message: 'Invalid input'
				});
			}

			return await createStr(formvalues);
		} catch (error) {
			console.log(error);
			return fail(500, {
				message: 'Internal Server Error'
			});
		}
	}
};
