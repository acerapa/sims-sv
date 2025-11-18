import { getInventoryById } from '$lib/server/db/queries/physical-inventory';
import { getProducts } from '$lib/server/db/queries/products';
import type { PageServerLoad, Actions } from './$types';
import { decode } from 'decode-formdata';

export const load: PageServerLoad = async ({ params }) => {
	const physicalInventory = await getInventoryById(parseInt(params.physical_inventory_id));
	const products = await getProducts();
	return { physicalInventory, products };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const formValues = decode(formData, {
			arrays: ['items']
		});

		console.log(formValues);
	}
};
