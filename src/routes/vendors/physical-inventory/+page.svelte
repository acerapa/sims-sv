<script lang="ts">
	import StartInventory from '#lib/components/pages/vendors/phyiscal-inventory/StartInventory.svelte';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '#lib/components/ui/dropdown-menu/index.ts';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '#lib/components/ui/card/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/table/index.ts';
	import { Ellipsis, Eye, Search } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { buttonVariants } from '#lib/components/ui/button/index.ts';
	import { paginatedParamsUpdate } from '#lib/utils/pagination.ts';
	import TablePagination from '#lib/components/common/TablePagination.svelte';

	let { data, form }: PageProps = $props();

	// Pagination related variables
	let total = $derived(data?.paginated?.total);
	let currentPage = $derived(data?.paginated?.page);
	let limit = $derived(data?.paginated?.limit);
	let totalPages = $derived(data?.paginated?.totalPages);
	const physicalInventories = $derived(data?.paginated?.data || []);

	const handlePageChange = (page: number) => {
		paginatedParamsUpdate({ page });
	};
	const handleLimitChange = (limit: number) => {
		paginatedParamsUpdate({ limit });
	};

	const onViewPhysicalInventory = (id: number) => {
		goto(
			resolve('/vendors/physical-inventory/[physical_inventory_id]', {
				physical_inventory_id: id.toString()
			})
		);
	};
</script>

<Card>
	<CardHeader class="flex items-center justify-between">
		<div class="space-y-1">
			<CardTitle>Physical Inventory</CardTitle>
			<CardDescription>Physical Inventory information list</CardDescription>
		</div>
		<StartInventory {data} {form} />
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="relative">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input type="search" placeholder="Search Physical Inventory..." class="h-10 pl-9" />
		</div>

		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Count Name</TableHead>
					<TableHead>Date Started</TableHead>
					<TableHead>Status</TableHead>
					<TableHead class="text-center">Items Counted</TableHead>
					<TableHead>Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each physicalInventories as inventory (inventory.id)}
					<TableRow>
						<TableCell>
							<p class="font-medium">{inventory.title}</p>
							<small class="text-muted-foreground">PC-00{inventory.id}</small>
						</TableCell>
						<TableCell>
							{inventory.created_at.toLocaleString('default', {
								day: 'numeric',
								month: 'long',
								year: 'numeric'
							})}
						</TableCell>
						<TableCell>
							<Badge
								variant="default"
								class={[
									'rounded-full px-3 py-1',
									inventory.status === 'finalized' ? 'bg-green-500' : 'bg-orange-300'
								]}
							>
								{inventory.status}
							</Badge>
						</TableCell>
						<TableCell class="text-center">{inventory.items_counted}</TableCell>
						<TableCell>
							<DropdownMenu>
								<DropdownMenuTrigger class={buttonVariants({ variant: 'ghost', size: 'sm' })}>
									<Ellipsis />
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem
										onSelect={() => onViewPhysicalInventory(inventory.id)}
										class="space-x-2"
									>
										<Eye />
										<span>View</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</TableCell>
					</TableRow>
				{/each}
				{#if physicalInventories.length === 0}
					<TableRow>
						<TableCell colspan={5} class="text-center text-muted-foreground">
							No physical inventories found!
						</TableCell>
					</TableRow>
				{/if}
			</TableBody>
		</Table>

		<TablePagination
			page={currentPage}
			{totalPages}
			{total}
			{limit}
			onPageChange={handlePageChange}
			onLimitChange={handleLimitChange}
		/>
	</CardContent>
</Card>
