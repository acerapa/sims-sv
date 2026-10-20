import {
	createFixAsset,
	getFixAssetById,
	getFixAssets,
	type CreateFixAsset
} from '$lib/server/db/queries/fix-assets';
import { decode } from 'decode-formdata';
import type { Actions, PageServerLoad } from './$types';
import z from 'zod';
import { fail } from '@sveltejs/kit';
import { FixAssetUser } from '$lib/const';
import { SvelteURLSearchParams } from 'svelte/reactivity';

export const load: PageServerLoad = async ({ url }) => {
	const fixAssets = await getFixAssets();
	const search = new SvelteURLSearchParams(url.searchParams);

	let fixAsset = null;
	const id = Number(search.get('id'));
	if (id) {
		fixAsset = await getFixAssetById(id);
	}

	return { fixAssets, fixAsset };
};

export const actions: Actions = {
	submitFixAsset: async ({ request }) => {
		try {
			const formData = await request.formData();
			const formValues = decode(formData, {
				dates: ['date_transfered'],
				numbers: [
					'staff_user_id',
					'items.$.product_id',
					'items.$.quantity',
					'items.$.cost',
					'items.$.total_cost'
				]
			}) as CreateFixAsset;

			const validationSchema = z.object({
				date_transfered: z.date('Date transfered is required'),
				staff_user_id: z.number('Staff user is required'),
				notes: z.string().optional(),
				user: z.enum(Object.values(FixAssetUser)),
				items: z
					.array(
						z.object({
							product_id: z.number(),
							quantity: z.number('Quantity is required').min(1, 'Quantity must be at least 1'),
							cost: z.number('Cost is required'),
							total_cost: z.number('Total Cost is required'),
							serial_number: z.string().optional()
						})
					)
					.min(1, 'At least one product is required')
			});

			const { success, error } = validationSchema.safeParse(formValues);
			if (!success) {
				console.log(error, formValues);
				return fail(400, {
					message: 'Invalid data!',
					errors: z.treeifyError(error),
					issues: error.issues
				});
			}

			return await createFixAsset(formValues);
		} catch (e) {
			return fail(500, {
				message: 'Internal server error',
				error: e
			});
		}
  }
};
