import { getCustomers } from '$lib/server/db/queries/customers';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const customers = await getCustomers();
	return { customers };
};
