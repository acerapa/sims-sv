<script lang="ts">
	import { pageContext } from '$lib/stores/pageContext';
	import PageTitle from '$lib/components/layout/PageTitle.svelte';
	import SubHeader from './SubHeader.svelte';
	let { children } = $props();

	let pageTitle = $state<{
		title: string;
		subTitle: string;
	}>({
		title: '',
		subTitle: ''
	});

	pageContext.subscribe((value) => {
		pageTitle = value.pageTitle;
	});
</script>

<section class="flex flex-col gap-8">
	<PageTitle title={pageTitle.title} subTitle={pageTitle.subTitle} />
	<SubHeader />
	{@render children()}
</section>
