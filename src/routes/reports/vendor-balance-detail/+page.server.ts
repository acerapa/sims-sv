import { getSuppliers } from '#lib/server/db/queries/suppliers.ts';
import { getVendorBalanceDetail } from '#lib/server/db/queries/reports/vendor-balance-detail.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const from = url.searchParams.get('from') || undefined;
	const to = url.searchParams.get('to') || undefined;
	const supplierIdParam = url.searchParams.get('vendor');
	const supplierId = supplierIdParam ? Number(supplierIdParam) : undefined;

	const [rows, suppliers] = await Promise.all([
		getVendorBalanceDetail(from, to, supplierId),
		getSuppliers()
	]);

	return {
		rows,
		suppliers,
		filters: { from, to, supplierId }
	};
};
