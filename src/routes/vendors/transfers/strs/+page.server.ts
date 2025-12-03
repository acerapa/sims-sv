import { getProducts } from '$lib/server/db/queries/products';
import { getStores } from '$lib/server/db/queries/stores';
import { decode } from 'decode-formdata';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const stores = await getStores();
	const products = await getProducts();

	return { stores, products };
};

export const actions: Actions = {
	createStr: async ({ request }) => {
		const body = await request.formData();
		const formvalues = decode(body, {
			numbers: [
				'store_id',
				'items.$.product_id',
				'items.$.quantity',
				'items.$.cost',
				'items.$.total_cost'
			],
			dates: ['transfer_date']
		});

		console.log(formvalues);
	}
};
