import { getStores } from '$lib/server/db/queries/stores';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const stores = await getStores();
	return { stores };
};
