<script lang="ts">
	import StartInventory from '$lib/components/pages/vendors/phyiscal-inventory/StartInventory.svelte';
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
	import { Ellipsis, Search } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	let { data, form }: PageProps = $props();
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
							<Button variant="ghost" size="sm">
								<Ellipsis />
							</Button>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</CardContent>
</Card>
