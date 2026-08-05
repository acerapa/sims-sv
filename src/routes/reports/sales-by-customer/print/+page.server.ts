import { getSalesByCustomer } from '$lib/server/db/queries/reports/sales-by-customer';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const from = url.searchParams.get('from') || undefined;
	const to = url.searchParams.get('to') || undefined;
  const view = url.searchParams.get('view') || 'summary';

  const { summary, detailed } = await getSalesByCustomer(from, to);

	return {
		summary,
		detailed,
		filters: { from, to },
		view
	};
};
