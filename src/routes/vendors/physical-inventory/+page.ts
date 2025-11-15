import type { PageLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';

export const load: PageLoad = () => {
	pageContext.set({
		pageTitle: {
			title: 'Physical Inventory',
			subTitle: 'Manage supplier deliveries and reconcile physical stock.'
		}
	});
};
