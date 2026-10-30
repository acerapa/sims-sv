import { getInventoryById } from '$lib/server/db/queries/physical-inventory';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const sheetId = Number(params.id);
	if (!Number.isInteger(sheetId) || sheetId <= 0) {
		throw new Error('Invalid physical inventory id');
	}

	const sheet = await getInventoryById(sheetId);
	if (!sheet) {
		throw new Error(`Physical inventory with ID ${sheetId} not found`);
	}

	return { sheet };
};
