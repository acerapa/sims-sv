import { desc, eq, asc, ilike, or, count, sql, sum, and, lte, gt } from 'drizzle-orm';
import { db } from '..';
import { products, productsToSupplier } from '../schema';

export interface CreateProductData {
	sku: string;
	quantity: number;
	sale_price: number;
	category_id: number;
	cost: number;
	minimum_quantity: number | null;
	sales_description: string | null;
	purchase_description: string | null;
	selling_bracket_id: number | null;
	suppliers: {
		supplier_id: number;
	}[];
}

export interface UpdateProductData extends CreateProductData {
	id: number;
}

export const createProduct = async (data: CreateProductData) => {
	return await db.transaction(async (tx) => {
		const [product] = await tx
			.insert(products)
			.values(
				Object({
					sku: data.sku,
					quantity: data.quantity,
					sale_price: data.sale_price,
					category_id: data.category_id,
					cost: data.cost,
					minimum_quantity: data.minimum_quantity,
					sales_description: data.sales_description,
					selling_bracket_id: data.selling_bracket_id,
					purchase_description: data.purchase_description
				})
			)
			.returning({
				id: products.id,
				sku: products.sku,
				cost: products.cost,
				quantity: products.quantity,
				sale_price: products.sale_price,
				minimum_quantity: products.minimum_quantity,
				selling_bracket_id: products.selling_bracket_id,
				purchase_description: products.purchase_description
			});

		if (data.suppliers.length) {
			await tx.insert(productsToSupplier).values(
				data.suppliers.map((supplier) => ({
					product_id: product.id,
					supplier_id: supplier.supplier_id
				}))
			);
		}

		return product;
	});
};

export const updateProduct = async (data: UpdateProductData) => {
	return await db.transaction(async (tx) => {
		const [product] = await tx
			.update(products)
			.set(
				Object({
					sku: data.sku,
					cost: data.cost,
					quantity: data.quantity,
					sale_price: data.sale_price,
					category_id: data.category_id,
					minimum_quantity: data.minimum_quantity,
					sales_description: data.sales_description,
					selling_bracket_id: data.selling_bracket_id,
					purchase_description: data.purchase_description
				})
			)
			.where(eq(products.id, data.id))
			.returning({
				id: products.id,
				sku: products.sku,
				quantity: products.quantity,
				sale_price: products.sale_price,
				minimum_quantity: products.minimum_quantity,
				selling_bracket_id: products.selling_bracket_id,
				purchase_description: products.purchase_description
			});

		await tx.delete(productsToSupplier).where(eq(productsToSupplier.product_id, data.id));

		if (data.suppliers.length) {
			await tx.insert(productsToSupplier).values(
				data.suppliers.map((supplier) => ({
					product_id: data.id,
					supplier_id: supplier.supplier_id
				}))
			);
		}

		return product;
	});
};

export const getProducts = async () => {
	return await db.query.products.findMany({
		orderBy: [desc(products.created_at)],
		columns: {
			id: true,
			sku: true,
			cost: true,
			quantity: true,
			sale_price: true,
			minimum_quantity: true,
			purchase_description: true,
			sales_description: true
		},
		with: {
			category: {
				columns: {
					id: true,
					name: true
				}
			},
			productToSuppliers: {
				columns: {
					supplier_id: true
				}
			}
		}
	});
};

export const getProduct = async (productId: number) => {
	const product = await db.query.products.findFirst({
		where: eq(products.id, productId),
		columns: {
			id: true,
			sku: true,
			cost: true,
			quantity: true,
			sale_price: true,
			category_id: true,
			minimum_quantity: true,
			sales_description: true,
			selling_bracket_id: true,
			purchase_description: true
		},
		with: {
			productToSuppliers: {
				columns: {
					supplier_id: true
				}
			}
		}
	});

	if (!product) {
		throw new Error(`Product with ID ${productId} not found`);
	}

	return product;
};

export const getProductsBySupplier = async (supplierId: number) => {
	const supplierProducts = await db
		.select({
			id: products.id,
			sku: products.sku,
			quantity: products.quantity,
			minimum_quantity: products.minimum_quantity,
			purchase_description: products.purchase_description,
			sale_price: products.sale_price,
			cost: products.cost
		})
		.from(products)
		.leftJoin(productsToSupplier, eq(productsToSupplier.product_id, products.id))
		.where(eq(productsToSupplier.supplier_id, supplierId));

	return supplierProducts;
};

export type SortableColumn =
	| 'sku'
	| 'purchase_description'
	| 'sale_price'
	| 'quantity'
	| 'created_at';
export type SortOrder = 'asc' | 'desc';

export interface GetProductsPaginatedParams {
	page?: number;
	limit?: number;
	sortBy?: SortableColumn;
	sortOrder?: SortOrder;
	search?: string;
}

export interface PaginatedProductsResult {
	products: Awaited<ReturnType<typeof getProducts>>;
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export const getProductsPaginated = async (
	params: GetProductsPaginatedParams = {}
): Promise<PaginatedProductsResult> => {
	const { page = 1, limit = 25, sortBy = 'created_at', sortOrder = 'desc', search = '' } = params;

	const offset = (page - 1) * limit;

	// Build sort column mapping
	const sortColumnMap: Record<SortableColumn, typeof products.sku> = {
		sku: products.sku,
		purchase_description: products.purchase_description,
		sale_price: products.sale_price,
		quantity: products.quantity,
		created_at: products.created_at
	};

	const sortColumn = sortColumnMap[sortBy] ?? products.created_at;
	const orderFn = sortOrder === 'asc' ? asc : desc;

	// Build search condition
	const searchCondition = search
		? or(ilike(products.sku, `%${search}%`), ilike(products.purchase_description, `%${search}%`))
		: undefined;

	// Get total count
	const [{ total }] = await db.select({ total: count() }).from(products).where(searchCondition);

	// Get paginated products with relations
	let paginatedProducts = await db.query.products.findMany({
		where: searchCondition,
		orderBy: [orderFn(sortColumn)],
		limit,
		offset,
		columns: {
			id: true,
			sku: true,
			quantity: true,
			sale_price: true,
			minimum_quantity: true,
			purchase_description: true
		},
		with: {
			category: {
				columns: {
					id: true,
					name: true
				}
			},
			productToSuppliers: {
				columns: {
					supplier_id: true
				}
			}
		}
	});

	// sorting by category name in alphabetical order
	paginatedProducts = paginatedProducts.sort((a, b) =>
		a.category.name.localeCompare(b.category.name)
	);

	return {
		products: paginatedProducts,
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit)
	};
};

export const updateProductQuantities = async (
	updates: { product_id: number; quantity: number }[]
) => {
	if (!updates.length) return [];
	return await db.transaction(async (tx) => {
		const results = [];
		for (const { product_id, quantity } of updates) {
			const [row] = await tx
				.update(products)
				.set({ quantity })
				.where(eq(products.id, product_id))
				.returning({ id: products.id, quantity: products.quantity });
			if (row) results.push(row);
		}
		return results;
	});
};

export const getInventoryStats = async () => {
	const [stats] = await db
		.select({
			totalItems: count(),
			lowStockItems: sum(
				sql<number>`CASE WHEN ${products.quantity} > 0 AND ${products.quantity} <= ${products.minimum_quantity} THEN 1 ELSE 0 END`
			),
			outOfStock: sum(
				sql<number>`CASE WHEN ${products.quantity} = 0 OR ${products.quantity} IS NULL THEN 1 ELSE 0 END`
			),
			totalValue: sum(
				sql<number>`COALESCE(${products.quantity}, 0) * COALESCE(${products.cost}::numeric, 0)`
			)
		})
		.from(products);

	return {
		totalItems: stats.totalItems ?? 0,
		lowStockItems: parseInt(stats.lowStockItems ?? '0'),
		outOfStock: parseInt(stats.outOfStock ?? '0'),
		totalValue: parseFloat(stats.totalValue ?? '0')
	};
};
