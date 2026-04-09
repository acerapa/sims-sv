import type { PageLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';

export const load: PageLoad = ({ data }) => {
	pageContext.set({
		pageTitle: {
			title: `Sales Order SO-${data.salesOrder.id}`,
			subTitle: 'View sales order details'
		}
	});
	return data;
};
