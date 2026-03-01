import {
	getPurchasesByVendorSummary,
	getPurchasesByVendorDetail
} from '$lib/server/db/queries/reports';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const from = url.searchParams.get('from') || undefined;
	const to = url.searchParams.get('to') || undefined;
	const view = url.searchParams.get('view') || 'summary';

	const [summary, detail] = await Promise.all([
		view !== 'detail' ? getPurchasesByVendorSummary(from, to) : Promise.resolve([]),
		view !== 'summary' ? getPurchasesByVendorDetail(from, to) : Promise.resolve([])
	]);

	return {
		summary,
		detail,
		filters: { from, to },
		view
	};
};
