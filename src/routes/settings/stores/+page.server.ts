import { decode } from 'decode-formdata';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import z from 'zod';
import { db } from '$lib/server/db';
import { stores } from '$lib/server/db/schema';
import { getStores } from '$lib/server/db/queries/stores';

export const load: PageServerLoad = async ({ depends }) => {
	depends('settings:stores');
	const storeList = await getStores();

	return {
		stores: storeList
	};
};

export const actions: Actions = {
	createStore: async ({ request }) => {
		try {
			const data = await request.formData();
			const formValues = decode(data, {
				numbers: ['manager'],
				booleans: ['is_active']
			});

			const storeSchema = z.object({
				name: z.string().min(1, 'Name is required'),
				address: z.string().min(10, 'Address must be at least 10 characters'),
				phone_number: z.string().min(10, 'Phone number must be at least 10 characters'),
				manager: z.number().min(1, 'Manager is required'),
				is_active: z.boolean()
			});

			const { success, error } = storeSchema.safeParse(formValues);
			if (!success) {
				return fail(400, {
					errors: z.treeifyError(error),
					message: 'Invalid input'
				});
			}

			return await db.insert(stores).values(Object(formValues)).returning({
				id: stores.id,
				name: stores.name,
				address: stores.address,
				phone_number: stores.phone_number,
				manager: stores.manager,
				is_active: stores.is_active
			});
		} catch (error) {
			console.error(error);
			return fail(500, { message: 'Failed to create store' });
		}
	}
};
