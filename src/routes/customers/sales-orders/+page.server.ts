import { getSalesOrdersPaginated, getSalesOrderStats } from '#lib/server/db/queries/sales-orders.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const searchText = url.searchParams.get('search') as string;
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1') || 1);
  const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get('limit') ?? '10') || 10));

	const [paginated, salesOrderStats] = await Promise.all([
		getSalesOrdersPaginated(page, limit, searchText),
		getSalesOrderStats()
	]);

	return { paginated, salesOrderStats, searchText };
};
