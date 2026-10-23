import {
	getPurchasesByCategorySummary,
	getPurchasesByItemDetail
} from '$lib/server/db/queries/reports';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const from = url.searchParams.get('from') || undefined;
	const to = url.searchParams.get('to') || undefined;
	const view = url.searchParams.get('view') || 'summary';

	const [summary, detail] = await Promise.all([
		view !== 'detail' ? getPurchasesByCategorySummary(from, to) : Promise.resolve([]),
		view !== 'summary' ? getPurchasesByItemDetail(from, to) : Promise.resolve([])
	]);

	return {
		summary,
		detail,
		filters: { from, to },
		view
	};
};
