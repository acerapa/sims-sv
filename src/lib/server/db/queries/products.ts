import { desc, eq } from 'drizzle-orm';
import { db } from '..';
import { products, productsToSupplier } from '../schema';

export interface CreateProductData {
	sku: string;
	quantity: number;
	sale_price: number;
	category_id: number;
	preferred_supplier_id: number;
	minimum_quantity: number | null;
	sales_description: string | null;
	purchase_description: string | null;
	suppliers: {
		supplier_id: number;
		cost: number;
	}[];
}

export const createProduct = async (data: CreateProductData) => {
	await db.transaction(async (tx) => {
		const [productId] = await tx
			.insert(products)
			.values(
				Object({
					sku: data.sku,
					quantity: data.quantity,
					sale_price: data.sale_price,
					category_id: data.category_id,
					preferred_supplier_id: data.preferred_supplier_id,
					minimum_quantity: data.minimum_quantity,
					sales_description: data.sales_description,
					purchase_description: data.purchase_description
				})
			)
			.returning({ lastInsertedId: products.id });

		await tx.insert(productsToSupplier).values(
			data.suppliers.map((supplier) => {
				return Object({
					product_id: productId.lastInsertedId,
					supplier_id: supplier.supplier_id,
					cost: supplier.cost
				});
			})
		);
	});
};

export const getProducts = async () => {
	return await db.query.products.findMany({
		orderBy: [desc(products.created_at)],
		columns: {
			id: true,
			sku: true,
			quantity: true,
			minimum_quantity: true,
			purchase_description: true,
			preferred_supplier_id: true
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
					supplier_id: true,
					cost: true
				}
			}
		}
	});
};

export const getProductsBySupplier = async (supplierId: number) => {
	const supplierProducts = await db
		.select({
			id: products.id,
			sku: products.sku,
			quantity: products.quantity,
			minimum_quantity: products.minimum_quantity,
			purchase_description: products.purchase_description,
			preferred_supplier_id: products.preferred_supplier_id
		})
		.from(products)
		.leftJoin(productsToSupplier, eq(productsToSupplier.product_id, products.id))
		.where(eq(productsToSupplier.supplier_id, supplierId));

	return supplierProducts;
};
