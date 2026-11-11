import type { PageLoad } from './$types';
import { pageContext } from '#lib/stores/pageContext.ts';

export const load: PageLoad = ({ data }) => {
	pageContext.set({
		pageTitle: {
			title: 'Return Merchandise Authorization',
			subTitle: 'Manage product returns and authorizations.'
		}
	});
	return data; // keep the component’s data prop in sync with the server load
};
