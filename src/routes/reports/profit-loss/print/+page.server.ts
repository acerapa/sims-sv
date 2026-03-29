import {
	getProfitLossSummary,
	getProfitLossMonthly,
	getProfitLossDetail
} from '$lib/server/db/queries/reports';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const from = url.searchParams.get('from') || undefined;
	const to = url.searchParams.get('to') || undefined;
	const view = url.searchParams.get('view') || 'summary';

	const [summary, monthly, detail] = await Promise.all([
		getProfitLossSummary(from, to),
		view !== 'detail' ? getProfitLossMonthly(from, to) : Promise.resolve([]),
		view !== 'summary' ? getProfitLossDetail(from, to) : Promise.resolve([])
	]);

	return {
		summary,
		monthly,
		detail,
		filters: { from, to },
		view
	};
};
