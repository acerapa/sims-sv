import {
	getSellingBrackets,
	updateCreateSellingBrackets
} from '$lib/server/db/queries/selling-brackets';
import { decode } from 'decode-formdata';
import z from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import type { Bracket } from '$lib/types/global';

export const load: PageServerLoad = async () => {
	const sellingBrackets = await getSellingBrackets();
	return { sellingBrackets };
};

export const actions: Actions = {
	addNewSellingBracket: async ({ request }) => {
		try {
			const formData = await request.formData();
			const formValues = decode(formData, {
				numbers: [
					'brackets.$.start_price',
					'brackets.$.end_price',
					'brackets.$.discount_percentage',
					'brackets.$.id'
				],
				booleans: ['brackets.$.is_edited', 'brackets.$.is_deleted']
			});

			const bracketSchema = z.object({
				brackets: z
					.array(
						z.object({
							id: z.number().nullable(),
							start_price: z.number().min(0),
							end_price: z.number().min(0),
							discount_percentage: z.number().min(0),
							is_edited: z.boolean().default(false),
							is_deleted: z.boolean().default(false)
						})
					)
					.min(1)
			});

			const { success, error } = bracketSchema.safeParse(formValues);
			if (!success) {
				return fail(400, {
					errors: z.treeifyError(error),
					issues: error.issues,
					message: 'Invalid input'
				});
			}

			await updateCreateSellingBrackets(formValues.brackets as Bracket[]);
		} catch (error) {
			console.error(error);
			return fail(500, {
				message: 'An error occurred while processing the form',
				error: error
			});
		}
	}
};
