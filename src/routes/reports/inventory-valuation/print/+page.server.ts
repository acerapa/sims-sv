import {
	getInventoryValuationDetail,
	getInventoryValuationSummary
} from '$lib/server/db/queries/reports/inventory-valuation';
import type { PageServerLoad } from './$types';

const readProductParam = (param: string | null): number | undefined => {
	const parsed = Number(param);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

export const load: PageServerLoad = async ({ url }) => {
	const from = url.searchParams.get('from') || undefined;
	const to = url.searchParams.get('to') || undefined;
	const view = url.searchParams.get('view') || 'detail';
	const productId = readProductParam(url.searchParams.get('product'));

	const [summary, detail] = await Promise.all([
		view === 'summary' ? getInventoryValuationSummary(from, to, productId) : Promise.resolve([]),
		view === 'detail' ? getInventoryValuationDetail(from, to, productId) : Promise.resolve([])
	]);

	return {
		summary,
		detail,
		filters: { from, to },
		view
	};
};
