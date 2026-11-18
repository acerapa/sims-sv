import { createCustomer, getPaginatedCustomers } from '#lib/server/db/queries/customers.ts';
import { decode } from 'decode-formdata';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import z from 'zod';
import type { Customer } from '#lib/types/global.ts';

export const load: PageServerLoad = async ({ url }) => {
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1') || 1);
	const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get('limit') ?? '10') || 10));

	const paginated = await getPaginatedCustomers(page, limit);
	return { paginated };
};

export const actions: Actions = {
	addNewClient: async ({ request }) => {
		try {
			const formData = await request.formData();
			const formValues = decode(formData) as Customer;

			const clientSchema = z.object({
				name: z.string().min(1, 'Name is required'),
				address: z.string().optional(),
				phone: z.string().optional().nullable(),
				viber: z.string().optional().nullable(),
				fb_account: z.string().optional()
			});

			const { success, error } = clientSchema.safeParse(formValues);
			if (!success) {
				return fail(400, {
					errors: z.treeifyError(error),
					message: 'Invalid input'
				});
			}

			return await createCustomer(formValues);
		} catch (error) {
			console.error(error);
			return fail(500, { message: 'Failed to add new client' });
		}
	}
};
