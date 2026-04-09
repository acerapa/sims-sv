import { getSalesOrder } from '$lib/server/db/queries/sales-orders';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = parseInt(params.id);
	const salesOrder = await getSalesOrder(id);

	if (!salesOrder) {
		error(404, 'Sales order not found');
	}

	return { salesOrder };
};
