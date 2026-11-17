import { decode } from 'decode-formdata';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import z from 'zod';
import {
	getPaginatedInventories,
	startInventory,
	type StartInventory
} from '#lib/server/db/queries/physical-inventory.ts';

export const load: PageServerLoad = async ({ url }) => {
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1') || 1);
	const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get('limit') ?? '10') || 10));

	const paginated = await getPaginatedInventories(page, limit);

	return { paginated };
};

export const actions: Actions = {
	default: async ({ request }) => {
		try {
			const formData = await request.formData();
			const formValues = decode(formData, {
				numbers: ['created_by']
			}) as StartInventory;

			const physicalInventorySchema = z.object({
				title: z.string('Title is required!').min(1, 'Title must be at least 1 character long'),
				notes: z.string(),
				created_by: z.number('Created by is required!').min(1, 'Created by is required!')
			});

			const { success, error } = physicalInventorySchema.safeParse(formValues);

			if (!success) {
				return fail(400, {
					message: 'Invalid input',
					errors: z.treeifyError(error)
				});
			}
			return startInventory(formValues);
		} catch (error) {
			console.error(error);
			return fail(500, {
				message: 'An error occurred while processing the form',
				details: (error as Error)?.message || 'Unknown error'
			});
		}
	}
};
