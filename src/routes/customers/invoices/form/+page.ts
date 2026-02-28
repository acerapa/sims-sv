import type { PageLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';

export const load: PageLoad = ({ data }) => {
	pageContext.set({
		pageTitle: {
			title: 'Create Invoice',
			subTitle: 'Create a new invoice from a sales order'
		}
	});
	return data;
};
