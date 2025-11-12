import { eq } from 'drizzle-orm';
import { db } from '..';
import { products, purchaseOrderItems, purchaseOrders } from '../schema';

export interface CreatePO {
	reference: string;
	supplier_id: number;
	receive_date: Date;
	receive_type: string;
	notes?: string;
	products: {
		product_id: number;
		quantity: number;
		cost: number;
		total_cost: number;
	}[];
	sub_total: number;
	discount: number;
	total: number;
}

export const createReceivePO = async (data: CreatePO) => {
	return await db.transaction(async (tx) => {
		const [po] = await tx
			.insert(purchaseOrders)
			.values(
				Object({
					reference: data.reference,
					supplier_id: data.supplier_id,
					receive_date: data.receive_date,
					receive_type: data.receive_type,
					notes: data.notes,
					sub_total: data.sub_total,
					discount: data.discount,
					total: data.total
				})
			)
			.returning({ lastInsertedId: purchaseOrders.id });

		await tx.insert(purchaseOrderItems).values(
			data.products.map((product) => {
				return Object({
					purchase_order_id: po.lastInsertedId,
					...product
				});
			})
		);

		const pds = await tx.select({ id: products.id, quantity: products.quantity }).from(products);

		await Promise.all(
			data.products.map(async (product) => {
				const p = pds.find((prod) => prod.id === product.product_id);
				if (!p) {
					throw new Error(`Product with ID ${product.product_id} not found`);
				}
				return await tx
					.update(products)
					.set({ quantity: product.quantity + (p.quantity ? p.quantity : 0) })
					.where(eq(products.id, product.product_id));
			})
		);

		return po;
	});
};

// Purchase Order list
// Bill Section should be under inventory and beside the receive po
// If Check: Check number, Amount payment date
// If Cash: Date ug Amount
