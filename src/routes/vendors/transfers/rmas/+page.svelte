<script lang="ts">
	import { page } from '$app/state';
	import RMAForm from '$lib/components/pages/vendors/transfers/rmas/RMAForm.svelte';
	import { Button } from '$lib/components/ui/button';
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

	const rmas = $derived(page.data.rmas);

	$inspect(page);
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="space-y-2">
				<CardTitle>Return Merchandise Authorization</CardTitle>
				<CardDescription>Manage returns to suppliers</CardDescription>
			</div>
			<RMAForm />
		</div>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="relative">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input type="search" placeholder="Search rmas..." class="h-10 pl-9" />
		</div>
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>RMA No.</TableHead>
					<TableHead>Supplier</TableHead>
					<TableHead>Date</TableHead>
					<TableHead class="text-center"># of Items</TableHead>
					<TableHead>Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#if rmas.length === 0}
					<TableRow>
						<TableCell colspan={5} class="py-4 text-center">No Data</TableCell>
					</TableRow>
				{:else}
					{#each rmas as rma (rma.id)}
						<TableRow>
							<TableCell>RMA-00{rma.id}</TableCell>
							<TableCell>{rma.supplier_name}</TableCell>
							<TableCell>{rma.date_returned}</TableCell>
							<TableCell class="text-center">{rma.items_count}</TableCell>
							<TableCell>
								<Button variant="ghost" size="icon">
									<Ellipsis />
								</Button>
							</TableCell>
						</TableRow>
					{/each}
				{/if}
			</TableBody>
		</Table>
	</CardContent>
</Card>
