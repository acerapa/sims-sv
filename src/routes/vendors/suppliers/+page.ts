import { browser } from '$app/environment';
import { pageContext } from '$lib/stores/pageContext';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ data }) => {
	if (browser) {
		pageContext.set({
			pageTitle: {
				title: 'Suppliers',
				subTitle: 'Manage Suppliers'
			}
		});
	}
	return data;
};
