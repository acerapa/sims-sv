import { getSuppliers } from '$lib/server/db/queries/suppliers';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const suppliers = await getSuppliers();
	return {
		suppliers
	};
};

export const actions: Actions = {
	getSupplierRelatedPO: async () => {}
};
