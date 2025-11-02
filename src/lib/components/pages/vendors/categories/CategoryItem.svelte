<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { Category } from '$lib/types/global';
	import { Check, ChevronRight, Folder, FolderOpen, Plus, X } from '@lucide/svelte';
	import CategoryItem from './CategoryItem.svelte';
	import { slide } from 'svelte/transition';
	import { Input } from '$lib/components/ui/input';
	import { enhance } from '$app/forms';
	import CategoryForm from './CategoryForm.svelte';

	interface Props {
		category: Category;
	}

	let open = $state(false);
	let openForm = $state(false);

	let { category }: Props = $props();

	const handleOpen = () => {
		open = !open;

		if (!open) {
			openForm = false;
		}
	};

	const handleOpenForm = () => {
		open = true;
		openForm = true;
	};
</script>

<div>
	<div class="group flex flex-col items-start rounded-sm pr-1 pl-0 font-normal hover:bg-gray-100">
		<div class="flex w-full items-center justify-between">
			<div class="flex items-center justify-start">
				<Button variant="ghost" class="cursor-pointer" onclick={handleOpen}>
					<ChevronRight
						class={[
							'size-4 text-muted-foreground transition-transform duration-300',
							open ? 'rotate-90' : ''
						]}
					/>
				</Button>
				<div class="flex items-center gap-2">
					{#if open}
						<FolderOpen class="size-4 text-blue-500" />
					{:else}
						<Folder class="size-4 text-muted-foreground" />
					{/if}
					<p class="text-sm">{category.name}</p>
				</div>
			</div>
			{#if !openForm}
				<Button
					variant="ghost"
					onclick={handleOpenForm}
					class="invisible size-7 cursor-pointer group-hover:visible  hover:bg-blue-100"
				>
					<Plus class="text-blue-500" />
				</Button>
			{/if}
		</div>
	</div>
	{#if open}
		<div class="flex flex-col gap-1 pl-5" transition:slide>
			{#each category.sub_categories as sub_category (sub_category.id)}
				<CategoryItem category={sub_category} />
			{/each}
			{#if openForm}
				<CategoryForm bind:open={openForm} />
			{/if}
		</div>
	{/if}
</div>
