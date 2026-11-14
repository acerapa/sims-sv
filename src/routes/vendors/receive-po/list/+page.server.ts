import { getPaginatedPurchaseOrders } from '#lib/server/db/queries/po.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1') || 1);
	const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get('limit') ?? '10') || 10));

  const paginated = await getPaginatedPurchaseOrders(page, limit);

  return { paginated };
};
