import { getFixAssetById } from '$lib/server/db/queries/fix-assets';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const fixAsset = await getFixAssetById(Number(params.id));
	return { fixAsset };
};
