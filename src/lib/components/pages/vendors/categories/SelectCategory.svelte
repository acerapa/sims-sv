<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Command, Input, List } from '$lib/components/ui/command';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import type { Category } from '$lib/types/global';
	import { ChevronsUpDown } from '@lucide/svelte';
	import SelectCategoryItem from './SelectCategoryItem.svelte';
	import { groupedCategories } from '$lib/utils/categories';

	let selectedCategory = $state<Category | null>(null);
	let { categories }: { categories: Category[] } = $props();
	let treeCategories: Category[] = $derived.by(() => {
		return groupedCategories(categories);
	});

	let open = $state(false);

	const itemHandler = (category: Category) => {
		selectedCategory = category;
		open = false;
	};

	const selectedCategoryNameWithParents = $derived.by(() => {
		if (!selectedCategory) return null;
		let name = selectedCategory.name;
		let parent = categories.find((category) => category.id === selectedCategory?.parent_id);
		while (parent) {
			name = `${parent.name} > ${name}`;
			parent = categories.find((category) => category.id === parent?.parent_id);
		}
		return name;
	});
</script>

<Popover bind:open>
	<PopoverTrigger class="w-full">
		<Button variant="outline" class="flex w-full justify-between font-normal text-muted-foreground">
			{selectedCategoryNameWithParents || 'Select Category'}
			<ChevronsUpDown class="opacity-50" />
			<input type="hidden" name="category_id" value={selectedCategory?.id} />
		</Button>
	</PopoverTrigger>
	<PopoverContent class="w-[var(--bits-floating-anchor-width)] p-0">
		<Command>
			<Input placeholder="Search category..." />
			<List>
				{#each treeCategories as category (category.id)}
					<SelectCategoryItem {selectedCategory} {itemHandler} {category} />
				{/each}
			</List>
		</Command>
	</PopoverContent>
</Popover>
