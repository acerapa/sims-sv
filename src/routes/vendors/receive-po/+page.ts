import type { PageLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';

export const load: PageLoad = ({ data }) => {
	pageContext.set({
		pageTitle: {
			title: 'Receive Purchase Order',
			subTitle: 'Record incoming items and update inventory.'
		}
	});

	return { ...data };
};
