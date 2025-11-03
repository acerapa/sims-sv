<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Command, Input, Item, List } from '$lib/components/ui/command';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import type { Category } from '$lib/types/global';
	import { ChevronsUpDown } from '@lucide/svelte';

	let selectedCategory: string | null = null;
	let { categories }: { categories: Category[] } = $props();
</script>

<Popover>
	<PopoverTrigger class="w-full">
		<Button variant="outline" class="flex w-full justify-between font-normal text-muted-foreground">
			{selectedCategory || 'Select Category'}
			<ChevronsUpDown class="opacity-50" />
		</Button>
	</PopoverTrigger>
	<PopoverContent class="w-[var(--bits-floating-anchor-width)] p-0">
		<Command>
			<Input placeholder="Search category..." />
			<List>
				{#each categories as category (category.id)}
					<Item>{category.name}</Item>
				{/each}
			</List>
		</Command>
	</PopoverContent>
</Popover>
