import { getBillWithItems } from '$lib/server/db/queries/bills';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const billId = Number(params.id);
	if (!Number.isInteger(billId) || billId <= 0) {
		throw new Error('Invalid bill id');
	}

	const bill = await getBillWithItems(billId);
	if (!bill) {
		throw new Error(`Bill with ID ${billId} not found`);
	}

	return { bill };
};
