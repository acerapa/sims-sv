import type { PageLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';

export const load: PageLoad = ({ data }) => {
	pageContext.set({
		pageTitle: {
			title: 'Sales Orders Form',
			subTitle: `Edit sales order #${data.salesOrder.id}`
		}
	});
	return data;
};
