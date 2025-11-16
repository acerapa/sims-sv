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

	let { data }: PageProps = $props();
	let physicalInventory = $derived(data.physicalInventory);
	let products = $derived(data.products);

	let items = $derived.by(() =>
		products.map((product) => ({
			product_id: product.id,
			sku: product.sku,
			purchase_description: product.purchase_description,
			category: product.category.name,
			system_count: product.quantity,
			actual_count: 0,
			difference: 0
		}))
	);
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
					{#each items as item (item.product_id)}
						<TableRow>
							<TableCell>{item.purchase_description}</TableCell>
							<TableCell>{item.sku}</TableCell>
							<TableCell>{item.category}</TableCell>
							<TableCell>{item.system_count}</TableCell>
							<TableCell>{item.actual_count}</TableCell>
							<TableCell>{item.difference}</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</CardContent>
	</Card>
</div>
