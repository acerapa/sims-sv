import { browser } from '$app/environment';
import { pageContext } from '$lib/stores/pageContext';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ data }) => {
	if (browser) {
		pageContext.set({
			pageTitle: {
				title: 'Product Categories',
				subTitle: 'Organize and manage product categories in a hierarchical structure.'
			}
		});
	}

	return data;
};
