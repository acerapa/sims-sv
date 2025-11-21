import {
	getInventoryById,
	upsertInventoryItems,
	type CreateInventoryItems
} from '$lib/server/db/queries/physical-inventory';
import { getProducts } from '$lib/server/db/queries/products';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { decode } from 'decode-formdata';

export const load: PageServerLoad = async ({ params }) => {
	const physicalInventory = await getInventoryById(parseInt(params.physical_inventory_id));
	const products = await getProducts();
	return { physicalInventory, products };
};

export const actions: Actions = {
	default: async ({ request }) => {
		try {
			const formData = await request.formData();
			const formValues = decode(formData, {
				arrays: ['items'],
				numbers: [
					'items.$.id',
					'items.$.physical_inventory_id',
					'items.$.product_id',
					'items.$.system_count',
					'items.$.difference',
					'items.$.actual_count'
				]
			}) as CreateInventoryItems;

			await upsertInventoryItems(formValues);
			return { success: true };
		} catch (error) {
			console.error(error);
			return fail(500, { error: 'Internal Server Error' });
		}
	}
};
