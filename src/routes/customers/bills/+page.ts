import type { PageLoad } from './$types';
import { pageContext } from '#lib/stores/pageContext.ts';

export const load: PageLoad = ({ data }) => {
	pageContext.set({
		pageTitle: {
			title: 'Bills',
			subTitle: 'Track payments received against customer invoices.'
		}
	});
	return data; // pass the server-loaded bills down to the page component
};
