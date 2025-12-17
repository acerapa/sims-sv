import { count, desc, eq } from 'drizzle-orm';
import { db } from '..';
import { ibrrItems, ibrrs, stores } from '../schema';

export interface CreateIBRRData {
	source_store_id: number;
	received_date: Date;
	str_id: string;
	notes?: string;
	items: {
		product_id: number;
		quantity: number;
		cost: number;
		total_cost: number;
	}[];
}

export const createIBRR = async (data: CreateIBRRData) => {
	return await db.transaction(async (tx) => {
		const [ibrr] = await tx
			.insert(ibrrs)
			.values(
				Object({
					source_store_id: data.source_store_id,
					received_date: data.received_date,
					str_id: data.str_id,
					notes: data.notes
				})
			)
			.returning({
				id: ibrrs.id,
				source_store_id: ibrrs.source_store_id,
				str_id: ibrrs.str_id,
				received_date: ibrrs.received_date,
				notes: ibrrs.notes
			});

		await tx.insert(ibrrItems).values(
			data.items.map((item) => {
				return Object({
					ibrr_id: ibrr.id,
					product_id: item.product_id,
					quantity: item.quantity,
					cost: item.cost,
					total_cost: item.total_cost
				});
			})
		);

		return ibrr;
	});
};

export const getIBRRs = async () => {
	return await db
		.select({
			id: ibrrs.id,
			source_store_id: ibrrs.source_store_id,
			source_store_name: stores.name,
			items_count: count(ibrrItems.id),
			str_id: ibrrs.str_id,
			received_date: ibrrs.received_date
		})
		.from(ibrrs)
		.leftJoin(stores, eq(stores.id, ibrrs.source_store_id))
		.leftJoin(ibrrItems, eq(ibrrItems.ibrr_id, ibrrs.id))
		.groupBy(ibrrs.id, ibrrs.source_store_id, ibrrs.str_id, ibrrs.received_date, stores.name)
		.orderBy(desc(ibrrs.received_date));
};
