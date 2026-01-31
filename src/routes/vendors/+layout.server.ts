import { getCategories } from '$lib/server/db/queries/categories';
import { getSuppliers } from '$lib/server/db/queries/suppliers';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ depends }) => {
	const categories = await getCategories();
	const suppliers = await getSuppliers();

	depends('vendors');

	return { categories, suppliers };
};
