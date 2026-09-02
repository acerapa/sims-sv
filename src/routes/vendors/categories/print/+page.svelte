<script lang="ts">
	import { page } from "$app/state";
	import PrintInternalLayout from "$lib/components/common/PrintInternalLayout.svelte";
	import CategoryItem from "$lib/components/pages/vendors/categories/print/CategoryItem.svelte";
	import type { Category } from "$lib/types/global";
	import { groupedCategories } from "$lib/utils/categories";

	const categories = $derived<Category[]>(groupedCategories(page.data.categories))

</script>
<PrintInternalLayout reportTitle="Product Categories">
    <hr class="my-2" />
	<div class="flex flex-col gap-2">
	    {#each categories as category (category.id)}
	        <CategoryItem category={category} level={0} />
	    {/each}
	</div>
</PrintInternalLayout>
