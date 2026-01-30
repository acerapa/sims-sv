import { getSellingBrackets } from '$lib/server/db/queries/selling-brackets';
import { decode } from 'decode-formdata';
import z from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const sellingBrackets = await getSellingBrackets();
	return { sellingBrackets };
};

export const actions: Actions = {
	addNewSellingBracket: async ({ request }) => {
		try {
			const formData = await request.formData();
			const formValues = decode(formData, {
				numbers: ['start_price', 'end_price', 'discount_percentage']
			});

			const bracketSchema = z.object({
				start_price: z.number().min(0),
				end_price: z.number().min(0),
				discount_percentage: z.number().min(0)
			});

			const { success, error } = bracketSchema.safeParse(formValues);
			if (!success) {
				return fail(400, {
					errors: z.treeifyError(error),
					issues: error.issues,
					message: 'Invalid input'
				});
			}
		} catch (error) {
			console.error(error);
			return fail(500, {
				message: 'An error occurred while processing the form',
				error: error
			});
		}
	}
};
