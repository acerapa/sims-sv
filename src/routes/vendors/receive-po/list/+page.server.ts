import { getPurchaseOrders } from '$lib/server/db/queries/po';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const purchaseOrders = await getPurchaseOrders();
	return { purchaseOrders };
};
