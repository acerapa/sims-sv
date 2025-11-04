import { getCategories } from '$lib/server/db/queries/categories';
import { getSuppliers } from '$lib/server/db/queries/suppliers';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const categories = await getCategories();
	return {
		categories: categories,
		suppliers: await getSuppliers()
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const body = await request.formData();

		console.log(body);
	}
};
