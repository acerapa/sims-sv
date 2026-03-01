import { getCategories } from '$lib/server/db/queries/categories';
import { getSellingBrackets } from '$lib/server/db/queries/selling-brackets';
import { getSuppliers } from '$lib/server/db/queries/suppliers';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ depends }) => {
	const categories = await getCategories();
	const suppliers = await getSuppliers();
	const sellingBrackets = await getSellingBrackets();

	depends('vendors');

	return { categories, suppliers, sellingBrackets };
};
