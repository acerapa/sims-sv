import { getSuppliers } from '$lib/server/db/queries/suppliers';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const suppliers = await getSuppliers();
	return { suppliers };
};
