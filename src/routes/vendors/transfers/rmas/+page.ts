import type { PageLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';

export const load: PageLoad = () => {
	pageContext.set({
		pageTitle: {
			title: 'Return Merchandise Authorization',
			subTitle: 'Manage product returns and authorizations.'
		}
	});
};
