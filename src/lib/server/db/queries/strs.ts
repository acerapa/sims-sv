import { count, desc, eq, inArray } from 'drizzle-orm';
import { db } from '..';
import { products, stores, strItems, strs } from '../schema';

export interface CreateSTRData {
	store_id: number;
	transfer_date: Date;
	notes?: string;
	items: {
		product_id: number;
		quantity: number;
		cost: number;
		total_cost: number;
	}[];
}

export const createStr = async (data: CreateSTRData) => {
	return await db.transaction(async (tx) => {
		const [str] = await tx
			.insert(strs)
			.values(
				Object({
					store_id: data.store_id,
					transfer_date: data.transfer_date,
					notes: data.notes
				})
			)
			.returning({
				id: strs.id,
				store_id: strs.store_id,
				transfer_date: strs.transfer_date,
				notes: strs.notes
			});

		await tx.insert(strItems).values(
			data.items.map((item) => {
				return Object({
					str_id: str.id,
					product_id: item.product_id,
					quantity: item.quantity,
					cost: item.cost,
					total_cost: item.total_cost
				});
			})
		);

		// update the products stocks
		const productsInvolved = await tx
			.select()
			.from(products)
			.where(
				inArray(
					products.id,
					data.items.map((item) => item.product_id)
				)
			);

		await Promise.all(
			data.items.map(async (item) => {
				const p = productsInvolved.find((pi) => pi.id === item.product_id);
				if (!p) {
					throw new Error(`Product with ID ${item.product_id} not found`);
				}
				return await tx
					.update(products)
					.set({ quantity: p.quantity - item.quantity })
					.where(eq(products.id, item.product_id));
			})
		);

		return str;
	});
};

export const getStrs = async () => {
	return await db
		.select({
			id: strs.id,
			store_id: strs.store_id,
			transfer_date: strs.transfer_date,
			notes: strs.notes,
			store_name: stores.name,
			items_count: count(strItems.id)
		})
		.from(strs)
		.leftJoin(stores, eq(stores.id, strs.store_id))
		.leftJoin(strItems, eq(strItems.str_id, strs.id))
		.groupBy(strs.id, strs.store_id, strs.transfer_date, strs.notes, strs.created_at, stores.name)
		.orderBy(desc(strs.created_at));
};
