import {
	createIBRR,
	getIBRRById,
	getIBRRs,
	type CreateIBRRData
} from '$lib/server/db/queries/ibrrs';
import { decode } from 'decode-formdata';
import type { Actions, PageServerLoad } from './$types';
import { z } from 'zod';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ depends, url }) => {
	depends('transfers:ibrrs');
	const ibrrId = url.searchParams.get('id');
	let ibrr = null;
	if (ibrrId) {
		ibrr = await getIBRRById(Number(ibrrId));
	}
	const ibrrs = await getIBRRs();
	return {
		ibrrs,
		ibrr
	};
};

export const actions: Actions = {
	createIBRR: async ({ request }) => {
		try {
			const formData = await request.formData();
			const formValues = decode(formData, {
				numbers: [
					'source_store_id',
					'items.$.product_id',
					'items.$.quantity',
					'items.$.cost',
					'items.$.total_cost'
				],
				dates: ['received_date']
			}) as CreateIBRRData;

			const ibrrSchema = z.object({
				source_store_id: z.number('Store is required!').int().positive(),
				received_date: z.date('Received date is required!'),
				str_id: z.string('Store reference is required!').min(1, 'Store reference is required!'),
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

			const { success, error } = ibrrSchema.safeParse(formValues);
			if (!success) {
				return fail(400, {
					errors: z.treeifyError(error),
					message: 'Invalid input'
				});
			}

			return await createIBRR(formValues);
		} catch (error) {
			console.error(error);
			return fail(500, {
				message: 'Internal Server Error'
			});
		}
	}
};
