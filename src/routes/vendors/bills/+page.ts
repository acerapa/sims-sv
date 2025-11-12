import { browser } from '$app/environment';
import { pageContext } from '$lib/stores/pageContext';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ data }) => {
	if (browser) {
		pageContext.set({
			pageTitle: {
				title: 'Billss',
				subTitle: 'Track and Manage vendor bills'
			}
		});
	}

	return {
		...data
	};
};
