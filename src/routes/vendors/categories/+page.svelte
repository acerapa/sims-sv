<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Plus, Search } from '@lucide/svelte';
	import CategoryItem from '$lib/components/pages/vendors/categories/CategoryItem.svelte';
	import type { Category } from '$lib/types/global';
	import { Button } from '$lib/components/ui/button';
	import CategoryForm from '$lib/components/pages/vendors/categories/CategoryForm.svelte';
	import type { PageProps } from './$types';
	import { groupedCategories } from '$lib/utils/categories';

	const { form, data }: PageProps = $props();

	const categories = $derived<Category[]>(groupedCategories(data.categories));

	let openForm = $state(false);
	const handleOpenForm = () => {
		openForm = true;
	};
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="space-y-2">
				<CardTitle>Categories</CardTitle>
				<CardDescription>Browse category hierarchy</CardDescription>
			</div>
			<Button onclick={handleOpenForm}>
				<Plus class="text-white" />
				Add Category
			</Button>
		</div>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="relative">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input type="search" placeholder="Search suppliers..." class="h-10 pl-9" />
		</div>
		<div class="flex flex-col gap-1">
			{#if openForm}
				<CategoryForm {form} bind:open={openForm} />
			{/if}
			{#each categories as category (category.id)}
				<CategoryItem {category} />
			{/each}
		</div>
	</CardContent>
</Card>
