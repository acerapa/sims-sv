<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Command, Input, Item, List } from '$lib/components/ui/command';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import type { Category } from '$lib/types/global';
	import { ChevronsUpDown } from '@lucide/svelte';

	let selectedCategory: string | null = null;

	const categories: Category[] = [
		{
			id: 1,
			name: 'Mobile',
			sub_categories: [
				{
					id: 2,
					name: 'Smartphone',
					sub_categories: [
						{
							id: 3,
							name: 'iPhone',
							sub_categories: [
								{
									id: 4,
									name: 'iPhone 13',
									sub_categories: []
								},
								{
									id: 5,
									name: 'iPhone 12',
									sub_categories: []
								}
							]
						},
						{
							id: 6,
							name: 'Samsung',
							sub_categories: [
								{
									id: 7,
									name: 'Galaxy S22',
									sub_categories: []
								},
								{
									id: 8,
									name: 'Galaxy S21',
									sub_categories: []
								}
							]
						}
					]
				},
				{
					id: 9,
					name: 'Tablet',
					sub_categories: [
						{
							id: 10,
							name: 'iPad',
							sub_categories: [
								{
									id: 11,
									name: 'iPad Pro',
									sub_categories: []
								},
								{
									id: 12,
									name: 'iPad Air',
									sub_categories: []
								}
							]
						},
						{
							id: 13,
							name: 'Samsung',
							sub_categories: [
								{
									id: 14,
									name: 'Galaxy Tab S7',
									sub_categories: []
								},
								{
									id: 15,
									name: 'Galaxy Tab S6',
									sub_categories: []
								}
							]
						}
					]
				}
			]
		}
	];
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
			<List></List>
		</Command>
	</PopoverContent>
</Popover>
