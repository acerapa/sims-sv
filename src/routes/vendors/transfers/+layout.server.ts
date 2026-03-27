import { getStores } from '$lib/server/db/queries/stores';
import { getProducts } from '$lib/server/db/queries/products';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const stores = await getStores();
	const products = await getProducts();
	return { stores, products };
};
