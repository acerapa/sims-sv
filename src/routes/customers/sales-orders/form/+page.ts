import type { PageLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';

export const load: PageLoad = ({ data }) => {
	pageContext.set({
		pageTitle: {
			title: 'Sales Orders Form',
			subTitle: 'Create new sales order'
		}
	});
	return data;
};
