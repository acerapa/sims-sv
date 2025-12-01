import type { PageLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';

export const load: PageLoad = () => {
	pageContext.set({
		pageTitle: {
			title: 'Inter-Branch Receive Report',
			subTitle: 'Process and record inter-branch inventory receipts.'
		}
	});
};
