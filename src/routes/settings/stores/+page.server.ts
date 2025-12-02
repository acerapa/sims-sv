import { decode } from 'decode-formdata';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import z from 'zod';

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

			console.log(formValues);
		} catch (error) {
			console.error(error);
			return fail(500, { message: 'Failed to create store' });
		}
	}
};
