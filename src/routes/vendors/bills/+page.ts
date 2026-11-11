import { browser } from '$app/env';
import { pageContext } from '#lib/stores/pageContext.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ data }) => {
	if (browser) {
		pageContext.set({
			pageTitle: {
				title: 'Bills',
				subTitle: 'Track and Manage vendor bills'
			}
		});
	}

	return {
		...data
	};
};
