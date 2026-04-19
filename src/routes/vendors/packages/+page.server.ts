import { decode } from 'decode-formdata';
import { fail } from '@sveltejs/kit';
import z from 'zod';
import type { Actions, PageServerLoad } from './$types';
import {
	createPackage,
	deletePackage,
	getPackage,
	getPackagesPaginated,
	updatePackage,
	type CreatePackageData,
	type PackageSortableColumn,
	type SortOrder,
	type UpdatePackageData
} from '$lib/server/db/queries/packages';
import { getProducts } from '$lib/server/db/queries/products';

const validSortColumns: PackageSortableColumn[] = ['name', 'created_at'];
const validSortOrders: SortOrder[] = ['asc', 'desc'];

export const load: PageServerLoad = async ({ url, depends }) => {
	depends('vendors:packages');

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1') || 1);
	const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get('limit') ?? '25') || 25));
	const sortByParam = url.searchParams.get('sort') as PackageSortableColumn | null;
	const sortBy: PackageSortableColumn = validSortColumns.includes(sortByParam!)
		? sortByParam!
		: 'created_at';
	const sortOrderParam = url.searchParams.get('order') as SortOrder | null;
	const sortOrder: SortOrder = validSortOrders.includes(sortOrderParam!) ? sortOrderParam! : 'desc';
	const search = url.searchParams.get('search') ?? '';

	const packageId = url.searchParams.get('id');
	let pkg = null;
	if (packageId) {
		pkg = await getPackage(parseInt(packageId));
	}

	const paginatedData = await getPackagesPaginated({ page, limit, sortBy, sortOrder, search });
	const products = await getProducts();

	return {
		...paginatedData,
		package: pkg,
		products,
		currentParams: { page, limit, sortBy, sortOrder, search }
	};
};

const packageProductSchema = z.object({
	product_id: z.number('Product is required').min(1, 'Product is required'),
	quantity: z.number('Quantity is required').min(1, 'Quantity must be at least 1')
});

export const actions: Actions = {
	addPackage: async ({ request }) => {
		try {
			const body = await request.formData();
			const formValues = decode(body, {
				arrays: ['products'],
				numbers: ['products.$.product_id', 'products.$.quantity']
			}) as CreatePackageData;

			const schema = z.object({
				name: z.string('Name is required').min(1, 'Name is required').max(255),
				description: z
					.string()
					.optional()
					.nullable()
					.transform((v) => (v ? v : null)),
				products: z.array(packageProductSchema).min(1, 'At least one product is required')
			});

			const { success, error, data } = schema.safeParse(formValues);
			if (!success) {
				return fail(400, {
					errors: z.treeifyError(error),
					issues: error.issues,
					message: 'Invalid input'
				});
			}

			return await createPackage(data as CreatePackageData);
		} catch (error) {
			return fail(500, {
				message: 'An error occurred while processing the form',
				error: (error as Error).message
			});
		}
	},

	updatePackage: async ({ request }) => {
		try {
			const body = await request.formData();
			const formValues = decode(body, {
				arrays: ['products'],
				numbers: ['id', 'products.$.product_id', 'products.$.quantity']
			}) as UpdatePackageData;

			const schema = z.object({
				id: z.number('Package ID is required').min(1),
				name: z.string('Name is required').min(1, 'Name is required').max(255),
				description: z
					.string()
					.optional()
					.nullable()
					.transform((v) => (v ? v : null)),
				products: z.array(packageProductSchema).min(1, 'At least one product is required')
			});

			const { success, error, data } = schema.safeParse(formValues);
			if (!success) {
				return fail(400, {
					errors: z.treeifyError(error),
					issues: error.issues,
					message: 'Invalid input'
				});
			}

			return await updatePackage(data as UpdatePackageData);
		} catch (error) {
			return fail(500, {
				message: 'An error occurred while processing the form',
				error: (error as Error).message
			});
		}
	},

	deletePackage: async ({ request }) => {
		try {
			const body = await request.formData();
			const id = parseInt(body.get('id')?.toString() ?? '');
			if (!id) {
				return fail(400, { message: 'Package ID is required' });
			}
			await deletePackage(id);
			return { success: true };
		} catch (error) {
			return fail(500, {
				message: 'An error occurred while deleting the package',
				error: (error as Error).message
			});
		}
	}
};
