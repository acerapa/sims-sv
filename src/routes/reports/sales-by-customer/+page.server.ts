import {
	getSalesByCustomerSummary,
	getSalesByCustomerDetail
} from '$lib/server/db/queries/reports';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const from = url.searchParams.get('from') || undefined;
	const to = url.searchParams.get('to') || undefined;

	const [summary, detail] = await Promise.all([
		getSalesByCustomerSummary(from, to),
		getSalesByCustomerDetail(from, to)
	]);

	return {
		summary,
		detail,
		filters: { from, to }
	};
};
