import { getSalesOrders, getSalesOrderStats } from '$lib/server/db/queries/sales-orders';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [salesOrders, salesOrderStats] = await Promise.all([
		getSalesOrders(),
		getSalesOrderStats()
  ]);

	const pagination = {
    page: 0,
    totalPages: 0,
    total: 0,
    limit: 0
  }

	return { salesOrders, salesOrderStats, pagination };
};
