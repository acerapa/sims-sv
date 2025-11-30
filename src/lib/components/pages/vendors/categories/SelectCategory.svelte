<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Command, CommandInput, CommandList } from '$lib/components/ui/command';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import type { Category } from '$lib/types/global';
	import { ChevronsUpDown } from '@lucide/svelte';
	import SelectCategoryItem from './SelectCategoryItem.svelte';
	import { groupedCategories } from '$lib/utils/categories';
	import { Input } from '$lib/components/ui/input';

	let {
		error,
		categories,
		disabled = $bindable(false),
		categoryId = $bindable(null)
	}: {
		categories: Category[];
		error: string[] | undefined;
		disabled?: boolean;
		categoryId?: number | null;
	} = $props();
	let treeCategories: Category[] = $derived.by(() => {
		return groupedCategories(categories);
	});

	let open = $state(false);
	let selectedCategory = $derived.by(
		() => categories.find((category) => category.id === categoryId) || null
	);

	const itemHandler = (category: Category) => {
		selectedCategory = category;
		categoryId = category.id;
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
		<Button
			{disabled}
			variant="outline"
			class={[
				'flex w-full justify-between font-normal disabled:opacity-100',
				error ? 'border !border-solid !border-red-500' : '',
				selectedCategoryNameWithParents ? '' : 'text-muted-foreground'
			]}
		>
			{selectedCategoryNameWithParents || 'Select Category'}
			<ChevronsUpDown class="opacity-50" />
			<input type="hidden" name="category_id" value={selectedCategory?.id} />
		</Button>
	</PopoverTrigger>
	<PopoverContent class="w-[var(--bits-floating-anchor-width)] p-0">
		<Command>
			<CommandInput type="search" placeholder="Search category..." />
			<CommandList>
				{#each treeCategories as category (category.id)}
					<SelectCategoryItem {selectedCategory} {itemHandler} {category} />
				{/each}
			</CommandList>
		</Command>
		<Input type="hidden" name="category_id" value={`${selectedCategory?.id}`} />
	</PopoverContent>
</Popover>
