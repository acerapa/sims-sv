<script lang="ts">
	import { Item } from '$lib/components/ui/command';
	import type { Category } from '$lib/types/global';
	import { Check, Folder } from '@lucide/svelte';
	import SelectCategoryItem from './SelectCategoryItem.svelte';

	interface Props {
		level?: number;
		category: Category;
		selectedCategory: Category | null;
		itemHandler: (category: Category) => void;
	}

	let { category, level = 0, selectedCategory = null, itemHandler }: Props = $props();

	let isSelected = $derived.by(() => selectedCategory && selectedCategory.id === category.id);
</script>

<div>
	<Item
		{disabled}
		class={['flex items-center gap-2 disabled:opacity-100', isSelected ? 'bg-slate-100' : '']}
		onclick={() => itemHandler(category)}
		style={{ paddingLeft: `${1.25 * level + 0.5}rem` }}
	>
		<Folder class="size-4 text-muted-foreground" />
		<p class="flex-1 text-sm">{category.name}</p>
		{#if isSelected}
			<Check class="size-4 text-primary" />
		{/if}
	</Item>

	{#if category.sub_categories?.length}
		<div class="flex flex-col">
			{#each category.sub_categories as sub_category (sub_category.id)}
				<SelectCategoryItem
					{selectedCategory}
					{itemHandler}
					category={sub_category}
					level={level + 1}
				/>
			{/each}
		</div>
	{/if}
</div>
