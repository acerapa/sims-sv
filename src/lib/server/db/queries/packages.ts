import { asc, count, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '..';
import { packages, packagesToProducts } from '../schema';

export interface PackageProductItem {
	product_id: number;
	quantity: number;
}

export interface CreatePackageData {
	name: string;
	description: string | null;
	products: PackageProductItem[];
}

export interface UpdatePackageData extends CreatePackageData {
	id: number;
}

export const createPackage = async (data: CreatePackageData) => {
	return await db.transaction(async (tx) => {
		const [pkg] = await tx
			.insert(packages)
			.values({
				name: data.name,
				description: data.description
			})
			.returning({
				id: packages.id,
				name: packages.name,
				description: packages.description
			});

		if (data.products.length) {
			await tx.insert(packagesToProducts).values(
				data.products.map((p) => ({
					package_id: pkg.id,
					product_id: p.product_id,
					quantity: p.quantity
				}))
			);
		}

		return pkg;
	});
};

export const updatePackage = async (data: UpdatePackageData) => {
	return await db.transaction(async (tx) => {
		const [pkg] = await tx
			.update(packages)
			.set({
				name: data.name,
				description: data.description
			})
			.where(eq(packages.id, data.id))
			.returning({
				id: packages.id,
				name: packages.name,
				description: packages.description
			});

		await tx.delete(packagesToProducts).where(eq(packagesToProducts.package_id, data.id));

		if (data.products.length) {
			await tx.insert(packagesToProducts).values(
				data.products.map((p) => ({
					package_id: data.id,
					product_id: p.product_id,
					quantity: p.quantity
				}))
			);
		}

		return pkg;
	});
};

export const deletePackage = async (id: number) => {
	return await db.transaction(async (tx) => {
		await tx.delete(packagesToProducts).where(eq(packagesToProducts.package_id, id));
		await tx.delete(packages).where(eq(packages.id, id));
	});
};

export const getPackage = async (id: number) => {
	return await db.query.packages.findFirst({
		where: eq(packages.id, id),
		with: {
			packagesToProducts: {
				with: {
					product: {
						columns: {
							id: true,
							sku: true,
							sales_description: true,
							sale_price: true
						}
					}
				}
			}
		}
	});
};

export const getPackages = async () => {
	return await db.query.packages.findMany({
		orderBy: [desc(packages.created_at)],
		with: {
			packagesToProducts: {
				with: {
					product: {
						columns: {
							id: true,
							sku: true,
							sales_description: true,
							sale_price: true
						}
					}
				}
			}
		}
	});
};

export type PackageSortableColumn = 'name' | 'created_at';
export type SortOrder = 'asc' | 'desc';

export interface GetPackagesPaginatedParams {
	page?: number;
	limit?: number;
	sortBy?: PackageSortableColumn;
	sortOrder?: SortOrder;
	search?: string;
}

export const getPackagesPaginated = async (params: GetPackagesPaginatedParams = {}) => {
	const { page = 1, limit = 25, sortBy = 'created_at', sortOrder = 'desc', search = '' } = params;

	const offset = (page - 1) * limit;

	const sortColumnMap = {
		name: packages.name,
		created_at: packages.created_at
	} as const;

	const sortColumn = sortColumnMap[sortBy] ?? packages.created_at;
	const orderFn = sortOrder === 'asc' ? asc : desc;

	const searchCondition = search
		? or(ilike(packages.name, `%${search}%`), ilike(packages.description, `%${search}%`))
		: undefined;

	const [{ total }] = await db
		.select({ total: count() })
		.from(packages)
		.where(searchCondition);

	const paginated = await db.query.packages.findMany({
		where: searchCondition,
		orderBy: [orderFn(sortColumn)],
		limit,
		offset,
		with: {
			packagesToProducts: {
				with: {
					product: {
						columns: {
							id: true,
							sku: true,
							sales_description: true,
							sale_price: true
						}
					}
				}
			}
		}
	});

	return {
		packages: paginated,
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit)
	};
};
