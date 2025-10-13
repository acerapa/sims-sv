import type { PageLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';

export const load: PageLoad = () => {
	pageContext.set({
		pageTitle: {
			title: 'Inventory',
			subTitle: 'Record items received from suppliers and update inventory.'
		}
	});
	return {};
};
