import { getCategories } from '$lib/server/db/queries/categories';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const categories = await getCategories();

	return {
		categories,
		total: categories.length
	};
};
