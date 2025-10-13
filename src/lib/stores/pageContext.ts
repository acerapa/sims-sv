import { writable } from 'svelte/store';

export const pageContext = writable<{
	pageTitle: {
		title: string;
		subTitle: string;
	};
}>({
	pageTitle: {
		title: '',
		subTitle: ''
	}
});
