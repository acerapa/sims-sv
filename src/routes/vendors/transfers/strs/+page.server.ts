import { getProducts } from '$lib/server/db/queries/products';
import { getStores } from '$lib/server/db/queries/stores';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const stores = await getStores();
	const products = await getProducts();

	return { stores, products };
};
