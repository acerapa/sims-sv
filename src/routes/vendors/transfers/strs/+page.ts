import type { PageLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';

export const load: PageLoad = () => {
	pageContext.set({
		pageTitle: {
			title: 'Stock Transfer Request',
			subTitle: 'Create and manage stock transfer requests between locations.'
		}
	});
};
