import { getSalesByRep } from '$lib/server/db/queries/reports/sales-by-rep';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const from = url.searchParams.get('from') || undefined;
	const to = url.searchParams.get('to') || undefined;

	const detailed = await getSalesByRep(from, to);

	return {
		detailed,
		filters: { from, to }
	};
};
