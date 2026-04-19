<script lang="ts">
	import { Item } from '$lib/components/ui/command';
	import type { Category } from '$lib/types/global';
	import { Check, Folder, Plus, X } from '@lucide/svelte';
	import SelectCategoryItem from './SelectCategoryItem.svelte';
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/input/input.svelte';
	import CategoryForm from './CategoryForm.svelte';

	interface Props {
		level?: number;
		category: Category;
		selectedCategory: Category | null;
		itemHandler: (category: Category) => void;
		hasInput?: boolean;
	}

	let {
		category,
		level = 0,
		selectedCategory = null,
		itemHandler,
		hasInput = false
	}: Props = $props();

	let isSelected = $derived.by(() => selectedCategory && selectedCategory.id === category.id);
	let showAddNewCategory = $state(false);
</script>

<div>
	<div class="flex items-center gap-2">
		<Item
			class={[
				'flex flex-1 items-center gap-2 disabled:opacity-100',
				isSelected ? 'bg-slate-100' : ''
			]}
			onclick={() => itemHandler(category)}
			style={{ paddingLeft: `${1.25 * level + 0.5}rem` }}
		>
			<Folder class="size-4 text-muted-foreground" />
			<p class="flex-1 text-sm">{category.name}</p>
			{#if isSelected}
				<Check class="size-4 text-primary" />
			{/if}
		</Item>
		{#if hasInput}
			<Button
				class="text-blue-500 hover:text-blue-700"
				variant="ghost"
				size="icon-sm"
				onclick={() => (showAddNewCategory = true)}
			>
				<Plus />
			</Button>
		{/if}
	</div>
	{#if showAddNewCategory}
		<div style={`margin-left: ${1.25 * (level + 1) + 0.5}rem`}>
			<CategoryForm bind:open={showAddNewCategory} parent_id={category.id} />
		</div>
	{/if}
	<!-- {#if showAddNewCategory}
		<div class="my-2 flex items-center gap-2" style={`margin-left: ${1.25 * (level + 1) + 0.5}rem`}>
			<Folder class="size-4 shrink-0 text-muted-foreground" />
			<Input class="w-full" />
			<Button class="text-green-500 hover:text-green-700" variant="ghost" size="icon-sm">
				<Check />
			</Button>
			<Button class="text-red-500 hover:text-red-700" variant="ghost" size="icon-sm">
				<X />
			</Button>
		</div>
	{/if} -->

	{#if category.sub_categories?.length}
		<div class="flex flex-col">
			{#each category.sub_categories as sub_category (sub_category.id)}
				<SelectCategoryItem
					{selectedCategory}
					{itemHandler}
					hasInput={true}
					category={sub_category}
					level={level + 1}
				/>
			{/each}
		</div>
	{/if}
</div>
