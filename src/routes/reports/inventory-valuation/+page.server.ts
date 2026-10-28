import {
	getInventoryValuationDetail,
	getInventoryValuationSummary
} from '$lib/server/db/queries/reports/inventory-valuation';
import { getProductOptions } from '$lib/server/db/queries/products';
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

	// Both views loaded up front (same shape as purchases-by-item), so tab
	// switching is instant; `view` only seeds the initial tab / print default.
	const [summary, detail, productOptions] = await Promise.all([
		getInventoryValuationSummary(from, to, productId),
		getInventoryValuationDetail(from, to, productId),
		getProductOptions()
	]);

	return {
		summary,
		detail,
		productOptions,
		filters: { from, to, product: productId ?? null },
		view
	};
};
