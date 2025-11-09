import { getSuppliers } from '$lib/server/db/queries/suppliers';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getProductsBySupplier } from '$lib/server/db/queries/products';
import { decode } from 'decode-formdata';
import z from 'zod';
import { createReceivePO, type CreatePO } from '$lib/server/db/queries/po';

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
	receivePo: async ({ request }) => {
		const body = await request.formData();
		const formValues = decode(body, {
			arrays: ['products'],
			numbers: [
				'sub_total',
				'total',
				'discount',
				'supplier_id',
				'products.$.quantity',
				'products.$.product_id',
				'products.$.cost',
				'products.$.total_cost'
			],
			dates: ['receive_date']
		}) as CreatePO;

		const purchaseOrderSchema = z.object({
			reference: z.string('Reference is required').min(1, 'Reference is required'),
			supplier_id: z.number('Supplier is required'),
			receive_date: z.date('Receive date is required'),
			receive_type: z.enum(
				['with_pay', 'without_pay'],
				'Must be either "with_pay" or "without_pay"'
			),
			notes: z.string().optional(),
			products: z
				.array(
					z.object({
						product_id: z.number('Product is required'),
						quantity: z.number('Quantity is required').min(1, 'Quantity must be at least 1'),
						cost: z.number('Cost is required'),
						total_cost: z.number('Total cost is required')
					})
				)
				.min(1, 'At least one product is required')
		});

		const { success, error } = purchaseOrderSchema.safeParse(formValues);

		if (!success) {
			return fail(400, {
				message: 'Invalid data!',
				errors: z.treeifyError(error),
				issues: error.issues
			});
		}

		return await createReceivePO(formValues);
	}
};
