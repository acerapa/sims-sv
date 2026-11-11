import { browser } from '$app/env';
import { pageContext } from '#lib/stores/pageContext.ts';
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
