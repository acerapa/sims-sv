import type { PageLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';

export const load: PageLoad = () => {
	pageContext.set({
		pageTitle: {
			title: 'Fix Assets',
			subTitle: 'Record and manage business assets assigned for seller use.'
		}
	});
};
