import { getSalesOrderStats } from '$lib/server/db/queries/sales-orders';
import { getInventoryStats } from '$lib/server/db/queries/products';
import {
	getRecentSalesOrders,
	getLowStockProducts,
	getTopSellingProducts
} from '$lib/server/db/queries/dashboard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [salesStats, inventoryStats, recentOrders, lowStockItems, topProducts] = await Promise.all(
		[
			getSalesOrderStats(),
			getInventoryStats(),
			getRecentSalesOrders(5),
			getLowStockProducts(5),
			getTopSellingProducts(5)
		]
	);

	return {
		salesStats,
		inventoryStats,
		recentOrders,
		lowStockItems,
		topProducts
	};
};
