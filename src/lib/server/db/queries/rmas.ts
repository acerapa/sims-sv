import { count, desc, eq } from 'drizzle-orm';
import { db } from '..';
import { rmaItems, rmas, suppliers } from '../schema';

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
