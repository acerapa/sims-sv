import { count, desc, eq } from 'drizzle-orm';
import { db } from '..';
import { rmaItems, rmas, suppliers } from '../schema';

export interface CreateRMAData {
	supplier_id: number;
	date_returned: Date;
	notes?: string | null;
	items: {
		product_id: number;
		quantity: number;
		cost: number;
		total_cost: number;
	}[];
}

export const createRMA = async (data: CreateRMAData) => {
	return await db.transaction(async (tx) => {
		const [rma] = await tx
			.insert(rmas)
			.values(
				Object({
					supplier_id: data.supplier_id,
					date_returned: data.date_returned,
					notes: data.notes
				})
			)
			.returning({
				id: rmas.id
			});

		await tx.insert(rmaItems).values(
			data.items.map((item) => {
				return Object({
					rma_id: rma.id,
					product_id: item.product_id,
					quantity: item.quantity,
					cost: item.cost,
					total_cost: item.total_cost
				});
			})
		);

		return rma;
	});
};

export const getRMAs = async () => {
	return await db
		.select({
			id: rmas.id,
			supplier_id: rmas.supplier_id,
			date_returned: rmas.date_returned,
			notes: rmas.notes,
			items_count: count(rmaItems.id),
			supplier_name: suppliers.name
		})
		.from(rmas)
		.leftJoin(suppliers, eq(suppliers.id, rmas.supplier_id))
		.leftJoin(rmaItems, eq(rmaItems.rma_id, rmas.id))
		.groupBy(rmas.id, rmas.supplier_id, rmas.date_returned, rmas.notes, suppliers.name)
		.orderBy(desc(rmas.created_at));
};
