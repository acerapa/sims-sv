import { getStores } from '$lib/server/db/queries/stores';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const storeList = await getStores();

	return { stores: storeList };
};
