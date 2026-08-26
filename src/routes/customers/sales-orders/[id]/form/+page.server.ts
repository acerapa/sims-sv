import { getCustomers } from '$lib/server/db/queries/customers';
import { getProducts } from '$lib/server/db/queries/products';
import { getSalesOrder, updateSalesOrder, type UpdateSalesOrder } from '$lib/server/db/queries/sales-orders';
import { getUsers } from '$lib/server/db/queries/users';
import { getPackages } from '$lib/server/db/queries/packages';
import { fail, error } from '@sveltejs/kit';
import { decode } from 'decode-formdata';
import z from 'zod';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, depends }) => {
	depends('sales-orders:form');
	const id = parseInt(params.id);
	
	const salesOrder = await getSalesOrder(id);
	if (!salesOrder) {
		error(404, 'Sales order not found');
	}

	// Check if order can be edited (only open orders)
	if (salesOrder.order_status !== 'open') {
		error(403, `Cannot edit ${salesOrder.order_status} sales orders`);
	}

	const customers = await getCustomers();
	const products = await getProducts();
	const users = await getUsers();
	const packages = await getPackages();

	return { salesOrder, customers, products, users, packages };
};

export const actions: Actions = {
	updateSalesOrder: async ({ request, params }) => {
		try {
			const orderId = parseInt(params.id);
			const body = await request.formData();
			
			const formValues = decode(body, {
				arrays: ['products'],
				numbers: [
					'total_cost',
					'customer_id',
					'staff_user_id',
					'products.$.quantity',
					'products.$.product_id',
					'products.$.package_id',
					'products.$.unit_price',
					'products.$.total_price'
				],
				dates: ['date_ordered']
			}) as UpdateSalesOrder & { order_id: number };

			const updateSalesOrderSchema = z.object({
				customer_id: z.number('Customer is required'),
				staff_user_id: z.number('Staff user is required'),
				date_ordered: z.date('Order date is required'),
				order_type: z.enum(['onetime', 'installment'], 'Must be either "onetime" or "installment"'),
				notes: z.string().optional(),
				products: z
					.array(
						z.object({
							id: z.number().optional(),
							product_id: z.number().nullable().optional(),
							package_id: z.number().nullable().optional(),
							quantity: z.number('Quantity is required').min(1, 'Quantity must be at least 1'),
							unit_price: z.number('Unit price is required'),
							total_price: z.number('Total price is required'),
							serial_number: z.string().optional()
						})
					)
					.min(1, 'At least one product is required')
			}).superRefine((val, ctx) => {
				(val.products || []).forEach((p: any, idx: number) => {
					if (!p.product_id && !p.package_id) {
						ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Either product or package is required', path: ['products', idx] });
					}
				});
			});

			const { success, error: parseError } = updateSalesOrderSchema.safeParse(formValues);

			if (!success) {
				return fail(400, {
					message: 'Invalid data!',
					errors: z.treeifyError(parseError),
					issues: parseError.issues
				});
			}

			return await updateSalesOrder(orderId, formValues);
		} catch (err) {
			return fail(500, {
				message: 'An error occurred while processing the form',
				error: (err as Error).message
			});
		}
	}
};
