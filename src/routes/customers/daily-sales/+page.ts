import type { PageLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';

export const load: PageLoad = ({ data }) => {
	pageContext.set({
		pageTitle: {
			title: 'Daily Sales',
			subTitle: 'Manage daily sales'
		}
	});
	return data; // keep the component’s data prop in sync with the server load
};
