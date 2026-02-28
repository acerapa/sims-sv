import type { PageLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';

export const load: PageLoad = ({ data }) => {
	pageContext.set({
		pageTitle: {
			title: `Invoice INV-${data.invoice.id}`,
			subTitle: 'View invoice details and manage payments'
		}
	});
	return data;
};
