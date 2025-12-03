<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import type { Product } from '$lib/types/global';
	import { Plus, Trash } from '@lucide/svelte';
	import { getContext } from 'svelte';

	const products = getContext('products') as Product[];
	const items = $state([
		{
			product_id: '',
			quantity: 1,
			cost: 0,
			amount: 0
		}
	]);

	const addItem = () => {
		items.push({
			product_id: '',
			quantity: 1,
			cost: 0,
			amount: 0
		});
	};

	const getProductName = (product_id: string): string | null => {
		const product = products.find((product) => product.id === parseInt(product_id));
		return product ? product.purchase_description : null;
	};

	// create a method that will remove an item based on its index
	const removeItem = (index: number) => {
		items.splice(index, 1);
	};
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<CardTitle>Items</CardTitle>
			<Button variant="outline" onclick={addItem}>
				<Plus />
				Add Item
			</Button>
		</div>
	</CardHeader>
	<CardContent>
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Product</TableHead>
					<TableHead>Quantity</TableHead>
					<TableHead>Cost</TableHead>
					<TableHead>Amount</TableHead>
					<TableHead>Action</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each items as _, index (index)}
					<TableRow>
						<TableCell>
							<Select type="single" bind:value={items[index].product_id}>
								<SelectTrigger>
									{getProductName(items[index].product_id)
										? getProductName(items[index].product_id)
										: 'Select Product'}
								</SelectTrigger>
								<SelectContent>
									{#each products as product (product.id)}
										<SelectItem value={product.id.toString()}>
											{product.purchase_description}
										</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</TableCell>
						<TableCell>
							<Input type="number" bind:value={items[index].quantity} />
						</TableCell>
						<TableCell>
							<Input type="number" bind:value={items[index].cost} readonly />
						</TableCell>
						<TableCell>
							<Input type="number" bind:value={items[index].amount} readonly />
						</TableCell>
						<TableCell>
							<Button
								disabled={items.length === 1}
								variant="ghost"
								onclick={() => removeItem(index)}
							>
								<Trash class="text-red-500" />
							</Button>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</CardContent>
</Card>
