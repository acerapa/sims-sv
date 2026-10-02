import { cancelSalesOrderById, getSalesOrder } from '$lib/server/db/queries/sales-orders';
import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = parseInt(params.id);
	const salesOrder = await getSalesOrder(id);

	if (!salesOrder) {
		error(404, 'Sales order not found');
	}

	return { salesOrder };
};

export const actions: Actions = {
  cancelSalesOrder: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('sales_order_id');
    try {
      await cancelSalesOrderById(parseInt(id as string));
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
