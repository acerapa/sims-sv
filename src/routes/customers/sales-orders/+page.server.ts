import { getSalesOrders, getSalesOrderStats } from '$lib/server/db/queries/sales-orders';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [salesOrders, salesOrderStats] = await Promise.all([
		getSalesOrders(),
		getSalesOrderStats()
	]);
	return { salesOrders, salesOrderStats };
};
