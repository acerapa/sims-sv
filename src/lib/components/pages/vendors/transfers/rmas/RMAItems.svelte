<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import ProductCombobox from '$lib/components/common/ProductCombobox.svelte';
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

	const products = $derived<Product[]>(page.data.products ?? []);
	let errors: typeof page.form.errors = $derived(page.form?.errors?.properties?.items?.items);

	const items = $state([
		{
			product_id: '',
			quantity: 1,
			cost: 0,
			total_cost: 0,
			serial_number: ''
		}
	]);

	const addItem = () => {
		items.push({
			product_id: '',
			quantity: 1,
			cost: 0,
			total_cost: 0,
			serial_number: ''
		});
	};

	const onSelectProduct = (ndx: number) => {
		const product_id = parseInt(items[ndx].product_id);
		const product = products.find((product) => product.id === product_id);

		if (product) {
			items[ndx].product_id = product.id.toString();
			items[ndx].cost = product.sale_price;
			items[ndx].total_cost = items[ndx].quantity * product.sale_price;
		}
	};

	const onQuantityUpdate = (ndx: number) => {
		if (!items[ndx].quantity || items[ndx].quantity < 1) {
			items[ndx].quantity = 1;
		}
		const item = items[ndx];
		if (!item || !item.product_id) return;

		item.total_cost = item.quantity * item.cost;
	};

	const removeItem = (ndx: number) => {
		items.splice(ndx, 1);

		if (errors && errors[ndx]) {
			errors.splice(ndx, 1);
		}
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
					<TableHead>Serial Number</TableHead>
					<TableHead>Quantity</TableHead>
					<TableHead>Cost</TableHead>
					<TableHead>Total Cost</TableHead>
					<TableHead>Action</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each items as _, ndx (ndx)}
					<TableRow>
						<TableCell class="align-top">
							<div>
								<ProductCombobox
									{products}
									bind:value={items[ndx].product_id}
									name={`items.${ndx}.product_id`}
									getLabel={(p) => p.purchase_description ?? ''}
									hasError={!!(errors && errors[ndx]?.properties?.product_id)}
									disabledIds={items.map((it) => parseInt(it.product_id)).filter(Boolean)}
									onSelect={() => onSelectProduct(ndx)}
								/>
								{#if errors && errors[ndx]?.properties?.product_id}
									<small class="text-red-500">
										{errors[ndx]?.properties?.product_id.errors[0]}
									</small>
								{/if}
							</div>
						</TableCell>
						<TableCell class="align-top">
							<Input
								type="text"
								placeholder="Serial Number"
								name={`items.${ndx}.serial_number`}
								bind:value={items[ndx].serial_number}
							/>
						</TableCell>
						<TableCell class="align-top">
							<Input
								type="number"
								onchange={() => onQuantityUpdate(ndx)}
								name={`items.${ndx}.quantity`}
								bind:value={items[ndx].quantity}
							/>
						</TableCell>
						<TableCell class="align-top">
							<Input
								type="number"
								name={`items.${ndx}.cost`}
								bind:value={items[ndx].cost}
								readonly
							/>
						</TableCell>
						<TableCell class="align-top">
							<Input
								type="number"
								name={`items.${ndx}.total_cost`}
								bind:value={items[ndx].total_cost}
								readonly
							/>
						</TableCell>
						<TableCell class="align-top">
							<Button disabled={items.length === 1} variant="ghost" onclick={() => removeItem(ndx)}>
								<Trash class="text-red-500" />
							</Button>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</CardContent>
</Card>
