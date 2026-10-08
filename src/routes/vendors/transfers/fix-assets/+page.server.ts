import { getFixAssets } from '$lib/server/db/queries/fix-assets';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const fixAssets = await getFixAssets();

	return { fixAssets };
};
