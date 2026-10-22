<script lang="ts">
	import CategoryItem from './CategoryItem.svelte';
	import type { Category } from '$lib/types/global';

	const { category, level = 0 }: { category: Category; level: number } = $props();
</script>

<!-- Indent is 12px per level; the PDF steps 14pt (see pdf.ts DEPTH_INDENT). -->
<p style="margin-left: {level * 12}px;">{category.name}</p>

{#each category.sub_categories ?? [] as sub_category (sub_category.id)}
	<CategoryItem category={sub_category} level={level + 1} />
{/each}
