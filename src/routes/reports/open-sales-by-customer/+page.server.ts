import { getOpenSalesGroupedByCustomer } from "../../../lib/server/db/queries/reports/open-sales-by-customer";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
	const from = url.searchParams.get('from') || undefined;
  const to = url.searchParams.get('to') || undefined;
  const summary = await getOpenSalesGroupedByCustomer();

  return {
    summary,
		filters: { from, to }
	};
};
