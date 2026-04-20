import { fail } from '@sveltejs/kit';
import z from 'zod';
import { decode } from 'decode-formdata';
import type { Actions, PageServerLoad } from './$types';
import {
	getProductsPaginated,
	updateProductQuantities,
	type SortableColumn,
	type SortOrder
} from '$lib/server/db/queries/products';

const validSortColumns: SortableColumn[] = [
	'sku',
	'purchase_description',
	'sale_price',
	'quantity',
	'created_at'
];
const validSortOrders: SortOrder[] = ['asc', 'desc'];

export const load: PageServerLoad = async ({ url, depends }) => {
	depends('settings:products');

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1') || 1);
	const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get('limit') ?? '25') || 25));
	const sortByParam = url.searchParams.get('sort') as SortableColumn | null;
	const sortBy: SortableColumn = validSortColumns.includes(sortByParam!)
		? sortByParam!
		: 'purchase_description';
	const sortOrderParam = url.searchParams.get('order') as SortOrder | null;
	const sortOrder: SortOrder = validSortOrders.includes(sortOrderParam!) ? sortOrderParam! : 'asc';
	const search = url.searchParams.get('search') ?? '';

	const paginatedData = await getProductsPaginated({ page, limit, sortBy, sortOrder, search });

	return {
		...paginatedData,
		currentParams: { page, limit, sortBy, sortOrder, search }
	};
};

export const actions: Actions = {
	updateQuantities: async ({ request }) => {
		try {
			const formData = await request.formData();
			const formValues = decode(formData, {
				arrays: ['updates'],
				numbers: ['updates.$.product_id', 'updates.$.quantity']
			}) as { updates?: { product_id: number; quantity: number }[] };

			const schema = z.object({
				updates: z
					.array(
						z.object({
							product_id: z.number().int().min(1),
							quantity: z
								.number('Quantity must be a number')
								.int('Quantity must be a whole number')
								.min(0, 'Quantity cannot be negative')
						})
					)
					.min(1, 'No changes to save')
			});

			const { success, error, data } = schema.safeParse(formValues);
			if (!success) {
				return fail(400, {
					errors: z.treeifyError(error),
					issues: error.issues,
					message: 'Invalid input'
				});
			}

			const results = await updateProductQuantities(data.updates);
			return { success: true, count: results.length };
		} catch (error) {
			return fail(500, {
				message: 'An error occurred while saving',
				error: (error as Error).message
			});
		}
	}
};
