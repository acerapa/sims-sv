import { db } from '..';
import { purchaseOrderItems, purchaseOrders } from '../schema';

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
	await db.transaction(async (tx) => {
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

		// TODO: Update the product/s quantity
	});
};
