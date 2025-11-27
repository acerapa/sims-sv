import { getCategories } from '$lib/server/db/queries/categories';
import { getProducts } from '$lib/server/db/queries/products';
import { getSuppliers } from '$lib/server/db/queries/suppliers';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ depends }) => {
	const products = await getProducts();
	const categories = await getCategories();
	const suppliers = await getSuppliers();

	depends('vendors');

	return { products, categories, suppliers };
};
