import type { PageLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';

export const load: PageLoad = async ({ data }) => {
	pageContext.set({
		pageTitle: {
			title: 'Packages',
			subTitle: 'Manage product bundles that can be added to sales orders as a group.'
		}
	});

	return data;
};
