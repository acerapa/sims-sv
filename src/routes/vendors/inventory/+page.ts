import type { PageLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';

export const load: PageLoad = async ({ data }) => {
	pageContext.set({
		pageTitle: {
			title: 'Item List',
			subTitle: 'Record items received from suppliers and update inventory.'
		}
	});

	return data;
};
