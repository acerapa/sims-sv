import type { PageLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';

export const load: PageLoad = ({ data }) => {
	pageContext.set({
		pageTitle: {
			title: 'Clients list',
			subTitle: 'Manage your clients'
		}
	});
	return data; // keep the component’s data prop in sync with the server load
};
