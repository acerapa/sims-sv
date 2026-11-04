import type { PageLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';

export const load: PageLoad = ({ data }) => {
	pageContext.set({
		pageTitle: {
			title: 'Inter-Branch Receive Report',
			subTitle: 'Process and record inter-branch inventory receipts.'
		}
	});
	return data; // keep the component’s data prop in sync with the server load
};
