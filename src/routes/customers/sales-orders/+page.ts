import type { PageLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';

export const load: PageLoad = () => {
	pageContext.set({
		pageTitle: {
			title: 'Sales Orders',
			subTitle: 'Manage sales orders and track order status.'
		}
	});
};
