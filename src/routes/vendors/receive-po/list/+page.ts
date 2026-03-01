import type { PageLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';

export const load: PageLoad = ({ data }) => {
	pageContext.set({
		pageTitle: {
			title: 'Received Purchase Orders',
			subTitle: 'View all received purchase orders.'
		}
	});

	return { ...data };
};
