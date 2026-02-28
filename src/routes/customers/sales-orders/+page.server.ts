import { getSalesOrders } from '$lib/server/db/queries/sales-orders';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const salesOrders = await getSalesOrders();
	return { salesOrders };
};
