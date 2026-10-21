import {
	getProductsForPrint,
	type SortableColumn,
	type SortOrder
} from '$lib/server/db/queries/products';
import type { PageServerLoad } from './$types';

const validSortColumns: SortableColumn[] = [
	'sku',
	'purchase_description',
	'sale_price',
	'quantity',
	'created_at'
];
const validSortOrders: SortOrder[] = ['asc', 'desc'];

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search') ?? '';
	const sortByParam = url.searchParams.get('sort') as SortableColumn | null;
	const sortBy: SortableColumn = validSortColumns.includes(sortByParam!)
		? sortByParam!
		: 'created_at';
	const sortOrderParam = url.searchParams.get('order') as SortOrder | null;
	const sortOrder: SortOrder = validSortOrders.includes(sortOrderParam!) ? sortOrderParam! : 'desc';

	const products = await getProductsForPrint({ search, sortBy, sortOrder });

	return {
		products,
		total: products.length,
		filters: { search }
	};
};
