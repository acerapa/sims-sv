import { getStores } from '$lib/server/db/queries/stores';
import { getProducts } from '$lib/server/db/queries/products';
import type { LayoutServerLoad } from './$types';
import { getManagerUsers } from '$lib/server/db/queries/users';

export const load: LayoutServerLoad = async () => {
	const stores = await getStores();
  const products = await getProducts();
  const managers = await getManagerUsers();
	return { stores, products, managers };
};
