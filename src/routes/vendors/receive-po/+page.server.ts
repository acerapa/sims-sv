import { getSuppliers } from '$lib/server/db/queries/suppliers';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getProductsBySupplier } from '$lib/server/db/queries/products';

export const load: PageServerLoad = async () => {
	const suppliers = await getSuppliers();
	return { suppliers };
};

export const actions: Actions = {
	getProductBySupplier: async ({ request }) => {
		const formData = await request.formData();
		const supplierId = formData.get('supplier_id');

		if (!supplierId) {
			return fail(400, {
				message: 'Supplier ID is required'
			});
		}

		const products = await getProductsBySupplier(parseInt(supplierId as string));
		return { products };
	},
	receivePo: async () => {}
};
