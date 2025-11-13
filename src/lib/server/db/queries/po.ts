import { eq, sql } from 'drizzle-orm';
import { db } from '..';
import { products, purchaseOrderItems, purchaseOrders } from '../schema';
import type { SupplierPO } from '$lib/types/global';

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

export const getPOBySupplierId = async (supplierId: number) => {
	const result = await db
		.select({
			id: purchaseOrders.id,
			reference: purchaseOrders.reference,
			po_items: {
				id: products.id,
				name: products.purchase_description,
				quantity: purchaseOrderItems.quantity,
				cost: purchaseOrderItems.cost,
				total_cost: purchaseOrderItems.total_cost
			},
			sub_total: purchaseOrders.sub_total,
			total: purchaseOrders.total,
			discount: purchaseOrders.discount
		})
		.from(purchaseOrders)
		.leftJoin(purchaseOrderItems, eq(purchaseOrders.id, purchaseOrderItems.purchase_order_id))
		.leftJoin(products, eq(purchaseOrderItems.product_id, products.id))
		.where(eq(purchaseOrders.supplier_id, supplierId));

	const supplierPos: SupplierPO[] = [];

	for (const po of result) {
		// check if po already exists in supplierPos
		const existingPo = supplierPos.find((p) => p.id === po.id);
		if (!existingPo) {
			supplierPos.push({
				id: po.id,
				reference: po.reference,
				po_items: [
					{
						id: po.po_items.id!,
						name: po.po_items.name!,
						quantity: po.po_items.quantity!,
						cost: parseFloat(po.po_items.cost!),
						total_cost: parseFloat(po.po_items.total_cost!)
					}
				],
				sub_total: parseFloat(po.sub_total),
				total: parseFloat(po.total),
				discount: parseFloat(po.discount)
			});
		} else {
			existingPo.po_items.push({
				id: po.po_items.id!,
				name: po.po_items.name!,
				quantity: po.po_items.quantity!,
				cost: parseFloat(po.po_items.cost!),
				total_cost: parseFloat(po.po_items.total_cost!)
			});
		}
	}

	return supplierPos;
};

// Purchase Order list
// Bill Section should be under inventory and beside the receive po
// If Check: Check number, Amount payment date
// If Cash: Date ug Amount
