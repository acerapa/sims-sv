import type { PageLoad } from './$types';
import { pageContext } from '#lib/stores/pageContext.ts';

export const load: PageLoad = ({ data }) => {
	pageContext.set({
		pageTitle: {
			title: 'Invoices',
			subTitle: 'Manage invoices and track payments.'
		}
	});
	return data;
};
