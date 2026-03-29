import {
	getProfitLossSummary,
	getProfitLossMonthly,
	getProfitLossDetail
} from '$lib/server/db/queries/reports';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const from = url.searchParams.get('from') || undefined;
	const to = url.searchParams.get('to') || undefined;

	const [summary, monthly, detail] = await Promise.all([
		getProfitLossSummary(from, to),
		getProfitLossMonthly(from, to),
		getProfitLossDetail(from, to)
	]);

	return {
		summary,
		monthly,
		detail,
		filters: { from, to }
	};
};
