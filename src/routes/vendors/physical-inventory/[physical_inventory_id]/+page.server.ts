import { getInventoryById } from '$lib/server/db/queries/physical-inventory';
import { getProducts } from '$lib/server/db/queries/products';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const physicalInventory = await getInventoryById(parseInt(params.physical_inventory_id));
	const products = await getProducts();
	return { physicalInventory, products };
};
