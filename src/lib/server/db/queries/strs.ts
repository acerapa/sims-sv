import { desc, eq } from 'drizzle-orm';
import { db } from '..';
import { stores, strItems, strs } from '../schema';

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

		return str;
	});
};

export const getStrs = async () => {
	return await db
		.select({
			id: strs.id,
			store_id: strs.store_id,
			transfer_date: strs.transfer_date,
			notes: strs.notes
		})
		.from(strs)
		.leftJoin(stores, eq(stores.id, strs.store_id))
		.orderBy(desc(strs.created_at));
};
