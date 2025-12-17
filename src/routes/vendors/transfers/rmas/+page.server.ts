import { getRMAs } from '$lib/server/db/queries/rmas';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rmas = await getRMAs();

	return { rmas };
};
