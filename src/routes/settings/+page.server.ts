import { getSellingBrackets } from '$lib/server/db/queries/selling-brackets';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const sellingBrackets = await getSellingBrackets();
	return { sellingBrackets };
};

export const actions: Actions = {};
