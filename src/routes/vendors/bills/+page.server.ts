import { getPOBySupplierId } from '$lib/server/db/queries/po';
import { getSuppliers } from '$lib/server/db/queries/suppliers';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const suppliers = await getSuppliers();
	return {
		suppliers
	};
};

export const actions: Actions = {
	getSupplierRelatedPO: async ({ request }) => {
		const formData = await request.formData();
		const supplierId = formData.get('supplier_id') as string;

		return await getPOBySupplierId(parseInt(supplierId));
	}
};
