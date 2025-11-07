import type { PageLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';

export const load: PageLoad = ({ data }) => {
	pageContext.set({
		pageTitle: {
			title: 'Receive Purchase Order',
			subTitle: 'Receive items from suppliers and update inventory.'
		}
	});

	return { ...data };
};
