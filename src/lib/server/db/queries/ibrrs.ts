import { count, desc, eq } from 'drizzle-orm';
import { db } from '..';
import { ibrrItems, ibrrs, stores } from '../schema';

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
		.groupBy(ibrrs.id, ibrrs.source_store_id, ibrrs.str_id, ibrrs.received_date)
		.orderBy(desc(ibrrs.received_date));
};
