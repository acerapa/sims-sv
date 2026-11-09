import { getVendorBalanceDetail } from '$lib/server/db/queries/reports/vendor-balance-detail';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const from = url.searchParams.get('from') || undefined;
	const to = url.searchParams.get('to') || undefined;
	const supplierIdParam = url.searchParams.get('vendor');
	const supplierId = supplierIdParam ? Number(supplierIdParam) : undefined;

	const rows = await getVendorBalanceDetail(from, to, supplierId);

	return {
		rows,
		filters: { from, to }
	};
};
