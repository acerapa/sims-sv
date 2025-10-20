import type { PageLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';

export const load: PageLoad = () => {
	pageContext.set({
		pageTitle: {
			title: 'Suppliers',
			subTitle: 'Manage Suppliers'
		}
	});

	return {};
};
