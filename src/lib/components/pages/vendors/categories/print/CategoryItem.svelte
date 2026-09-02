<script lang="ts">
	import type { Category } from "$lib/types/global";
	import CategoryItem from "./CategoryItem.svelte";

	const { category, level = $bindable(0) }: { category: Category; level: number } = $props();
</script>

<p style="margin-left: {level * 12}px;">{category.name}-{level}</p>

{#each category.sub_categories as sub_category (sub_category.id)}
	<CategoryItem category={sub_category} level={level + 1} />
{/each}
