<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, CircleCheck, Save } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Table, TableBody, TableCell, TableHeader, TableRow } from '$lib/components/ui/table';
	import TableHead from '$lib/components/ui/table/table-head.svelte';
	import { Input } from '$lib/components/ui/input';

	let { data }: PageProps = $props();
	let physicalInventory = $derived(data.physicalInventory);
	let products = $derived(data.products);

	let items = $state(
		products.map((product) => ({
			product_id: product.id,
			sku: product.sku,
			purchase_description: product.purchase_description,
			category: product.category.name,
			system_count: product.quantity,
			actual_count: 0,
			difference: 0 - parseInt(product.quantity)
		}))
	);

	const handleInputChange = (ndx: number) => {
		items[ndx].difference = items[ndx].actual_count - items[ndx].system_count;
	};
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<Button variant="ghost">
				<ArrowLeft />
			</Button>
			<div class="space-y-1">
				<h1 class="text-xl font-bold">{physicalInventory.title}</h1>
				<p class="text-sm text-muted-foreground">PC-00{physicalInventory.id}</p>
			</div>
		</div>
		<div class="flex items-center gap-3">
			<Button variant="outline">
				<Save />
				Save as Draft
			</Button>
			<Button>
				<CircleCheck />
				Finalized
			</Button>
		</div>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Physical Inventory Sheet</CardTitle>
			<CardDescription>
				This is a physical inventory sheet for the product {physicalInventory.title}.
			</CardDescription>
		</CardHeader>
		<CardContent>
			<form action="" method="post">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Item</TableHead>
							<TableHead>SKU/Item code</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Sys count</TableHead>
							<TableHead>Counted</TableHead>
							<TableHead>Difference</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each items as item, ndx (item.product_id)}
							<TableRow>
								{#if physicalInventory.status === 'draft'}
									<input
										type="hidden"
										value={physicalInventory.id}
										name={`items.${ndx}.physical_inventory_id`}
									/>
									<input type="hidden" value={item.product_id} name={`items.${ndx}.product_id`} />
									<input
										type="hidden"
										value={item.system_count}
										name={`items.${ndx}.system_count`}
									/>
									<input type="hidden" value={item.difference} name={`items.${ndx}.difference`} />
								{/if}
								<TableCell>{item.purchase_description}</TableCell>
								<TableCell>{item.sku}</TableCell>
								<TableCell>{item.category}</TableCell>
								<TableCell class="px-5">{item.system_count}</TableCell>
								<TableCell>
									{#if physicalInventory.status === 'draft'}
										<Input
											type="number"
											class="max-w-32"
											name={`items.${ndx}.actual_count`}
											bind:value={item.actual_count}
											placeholder="0"
											onchange={() => handleInputChange(ndx)}
										/>
									{:else}
										{item.actual_count}
									{/if}
								</TableCell>
								<TableCell
									class={[
										'px-5',
										parseInt(item.difference) > 0 ? 'text-green-500' : 'text-red-500'
									]}
								>
									{item.difference > 0 ? `+${item.difference}` : item.difference}
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</form>
		</CardContent>
	</Card>
</div>
