import { decode } from 'decode-formdata';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import z from 'zod';
import {
	createProduct,
	updateProduct,
	getProduct,
	getProductsPaginated,
	type CreateProductData,
	type UpdateProductData,
	type SortableColumn,
	type SortOrder
} from '$lib/server/db/queries/products';

const validSortColumns: SortableColumn[] = [
	'sku',
	'purchase_description',
	'sale_price',
	'quantity',
	'created_at'
];
const validSortOrders: SortOrder[] = ['asc', 'desc'];

export const load: PageServerLoad = async ({ url, depends }) => {
	depends('vendors:inventory');

	// Parse pagination/sorting params
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1') || 1);
	const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get('limit') ?? '25') || 25));
	const sortByParam = url.searchParams.get('sort') as SortableColumn | null;
	const sortBy: SortableColumn = validSortColumns.includes(sortByParam!)
		? sortByParam!
		: 'created_at';
	const sortOrderParam = url.searchParams.get('order') as SortOrder | null;
	const sortOrder: SortOrder = validSortOrders.includes(sortOrderParam!) ? sortOrderParam! : 'desc';
	const search = url.searchParams.get('search') ?? '';

	// Get single product if editing
	const productId = url.searchParams.get('id');
	let product = null;
	if (productId) {
		product = await getProduct(parseInt(productId));
	}

	// Get paginated products
	const paginatedData = await getProductsPaginated({
		page,
		limit,
		sortBy,
		sortOrder,
		search
	});

	return {
		...paginatedData,
		product,
		currentParams: { page, limit, sortBy, sortOrder, search }
	};
};

export const actions: Actions = {
	addProduct: async ({ request }) => {
		try {
			const body = await request.formData();
			const formvalues = decode(body, {
				arrays: ['suppliers'],
				numbers: [
					'category_id',
					'quantity',
					'cost',
					'minimum_quantity',
					'preferred_supplier_id',
					'sale_price',
					'suppliers.$.supplier_id',
					'suppliers.$.cost'
				]
			}) as CreateProductData;

			const productSchema = z.object({
				sku: z.string('Invalid SKU').min(1, 'SKU is required').max(1000),
				category_id: z.number('Category is required').min(1, 'Category is required'),
				quantity: z.number('Quantity is required').nullable().optional().default(0),
				cost: z.number('Cost is should be a number').nullable().default(0),
				minimum_quantity: z.number('Invalid minimum quantity').nullable().optional().default(0),
				sale_price: z.number('Sale price should be a number').nullable().default(0),
				suppliers: z
					.array(
						z.object({
							supplier_id: z.number('Supplier is required').min(1),
							cost: z.number('Cost is should be a number').min(0)
						})
					)
					.min(0),
				preferred_supplier_id: z
					.number('Preferred supplier is required')
					.optional()
					.nullable()
					.default(null),
				purchase_description: z
					.string('Purchase description is required')
					.min(1, 'Purchase description is required')
					.max(1000),
				sales_description: z
					.string('Sales description is required')
					.min(1, 'Sales description is required')
					.max(1000)
			});

			const { success, error } = productSchema.safeParse(formvalues);
			if (!success) {
				return fail(400, {
					errors: z.treeifyError(error),
					issues: error.issues,
					message: 'Invalid input'
				});
			}

			return await createProduct(formvalues);
		} catch (error) {
			return fail(500, {
				message: 'An error occurred while processing the form',
				error: error
			});
		}
	},

	updateProduct: async ({ request }) => {
		try {
			const body = await request.formData();
			const formvalues = decode(body, {
				arrays: ['suppliers'],
				numbers: [
					'id',
					'category_id',
					'quantity',
					'cost',
					'minimum_quantity',
					'sale_price',
					'suppliers.$.supplier_id',
					'suppliers.$.cost'
				]
			}) as UpdateProductData;

			const productSchema = z.object({
				id: z.number('Product ID is required').min(1, 'Product ID is required'),
				sku: z.string('Invalid SKU').min(1, 'SKU is required').max(1000),
				category_id: z.number('Category is required').min(1, 'Category is required'),
				quantity: z.number('Quantity is required').min(0),
				cost: z.number('Cost is should be a number').default(0),
				minimum_quantity: z.number('Invalid minimum quantity').default(0),
				sale_price: z.number('Sale price should be a number').nullable().default(0),
				suppliers: z
					.array(
						z.object({
							supplier_id: z.number('Supplier is required').min(1),
							cost: z.number('Cost is required').min(0)
						})
					)
					.min(0),
				purchase_description: z
					.string('Purchase description is required')
					.min(1, 'Purchase description is required')
					.max(1000),
				sales_description: z
					.string('Sales description is required')
					.min(1, 'Sales description is required')
					.max(1000)
			});

			const { success, error } = productSchema.safeParse(formvalues);
			if (!success) {
				return fail(400, {
					errors: z.treeifyError(error),
					issues: error.issues,
					message: 'Invalid input'
				});
			}

			return await updateProduct(formvalues);
		} catch (error) {
			console.error(error);
			return fail(500, {
				message: 'An error occurred while processing the form',
				error: error
			});
		}
	}
};
