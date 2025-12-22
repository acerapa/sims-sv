<script lang="ts">
	import StartInventory from '$lib/components/pages/vendors/phyiscal-inventory/StartInventory.svelte';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Ellipsis, Eye, Search } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import { Badge } from '$lib/components/ui/badge';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { buttonVariants } from '$lib/components/ui/button';

	let { data, form }: PageProps = $props();

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
				{#each data.physicalInventories as inventory (inventory.id)}
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
			</TableBody>
		</Table>
	</CardContent>
</Card>
