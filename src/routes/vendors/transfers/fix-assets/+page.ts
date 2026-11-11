import type { PageLoad } from './$types';
import { pageContext } from '#lib/stores/pageContext.ts';

export const load: PageLoad = ({ data }) => {
	pageContext.set({
		pageTitle: {
			title: 'Fix Assets',
			subTitle: 'Record and manage business assets assigned for seller use.'
		}
	});
	return data; // keep the component’s data prop in sync with the server load
};
