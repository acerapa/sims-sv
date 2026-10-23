<script lang="ts">
	import PrintReportLayout from '$lib/components/common/PrintReportLayout.svelte';
	import CategoryItem from '$lib/components/pages/vendors/categories/print/CategoryItem.svelte';
	import type { Category } from '$lib/types/global';
	import { groupedCategories } from '$lib/utils/categories';
	import { openAndPrint } from '$lib/utils/pdf';
	import { buildCategoriesPdf, buildCategoryRows } from './pdf';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Preview and PDF render from the same DFS traversal (buildCategoryRows),
	// so the list order on screen is exactly the list order in the PDF.
	let categories = $derived<Category[]>(groupedCategories(data.categories));
	let rows = $derived(buildCategoryRows(categories));
</script>

<svelte:head>
	<title>Print - Categories</title>
</svelte:head>

<PrintReportLayout
	reportTitle="Product Categories"
	onPrint={async () => openAndPrint(await buildCategoriesPdf(rows, data.total))}
>
	<div class="flex flex-col gap-2">
		{#each categories as category (category.id)}
			<CategoryItem {category} level={0} />
		{/each}
	</div>
</PrintReportLayout>
