<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import type { Category, Product, Supplier } from '$lib/types/global';
	import { Plus, Trash2 } from '@lucide/svelte';
	import z from 'zod';
	import ProductForm from '../product-form.svelte';
	import type { ActionData } from '../../../../../routes/vendors/receive-po/$types';

	interface Props {
		issues: z.core.$ZodIssue[] | undefined;
		products: Product[];
		categories: Category[];
		suppliers: Supplier[];
		items: {
			id: number;
			product_id: string;
			quantity: number;
			cost: number;
			sale_price: number;
			total_cost: number;
		}[];
		selectedSupplierId: string;
		form: ActionData;
		triggerRefetchProducts: () => void;
	}

	let {
		products,
		items = $bindable(),
		selectedSupplierId,
		issues,
		suppliers,
		categories,
		form,
		triggerRefetchProducts = () => {}
	}: Props = $props();

	let openProductForm = $state(false);
	let insertedProduct = $state<Product | null>(null);
	let lastInsertedProductId = $state<number | null>(null);
	let activeItemIndex = $state<number | null>(null);
	let subTotal = $derived.by(() => {
		return items
			.map((item) => item.total_cost)
			.filter(Boolean)
			.reduce((acc, curr) => acc + curr, 0)
			.toFixed(2);
	});
	let orderDiscount = $state<number>(0);
	let overAllTotal = $derived.by(() => {
		return (parseFloat(subTotal) - orderDiscount).toFixed(2);
	});
	let preSelectedSuppliers = $derived([
		{
			supplierId: selectedSupplierId,
			cost: 0
		}
	]);

	let groupedIssues = $derived.by(() => {
		let grouped: Record<string, string>[] = [];

		for (const issue of issues || []) {
			const [_, index, field] = issue.path;
			let value = grouped[index as number];
			if (value && typeof value === 'object') {
				value[field as string] = issue.message;
			} else {
				grouped[index as number] = { [field as string]: issue.message };
			}
		}

		return grouped;
	});

	export const addItem = () => {
		items.push({
			id: items.length + 1,
			product_id: '',
			quantity: 1,
			cost: 0,
			sale_price: 0,
			total_cost: 0
		});
	};

	const getProduct = (productId: number): Product | undefined => {
		return products.find((product) => product.id === productId);
	};

	const removeItem = (index: number) => {
		items.splice(index, 1);

		groupedIssues.splice(index, 1);
	};

	const onSelectProduct = (ndx: number) => {
		const item = items[ndx];
		const product = getProduct(parseInt(item.product_id));

		if (product) {
			item.cost = product.cost || 0;
			item.total_cost = item.quantity * item.cost;
		}
	};

	const onQuantityChange = (ndx: number) => {
		const item = items[ndx];
		item.total_cost = item.quantity * item.cost;
	};

	const onOpenProductForm = (ndx: number) => {
		activeItemIndex = ndx;
		openProductForm = true;
	};

	$effect(() => {
		if (insertedProduct) {
			triggerRefetchProducts();
			lastInsertedProductId = insertedProduct.id;
			insertedProduct = null;
		}

		if (products && lastInsertedProductId && lastInsertedProductId !== null) {
			const product = products.find((p) => p.id === lastInsertedProductId);

			if (product) {
				const cost = parseInt(product?.cost?.toString() || '0');

				if (activeItemIndex !== null) {
					items[activeItemIndex] = {
						id: items.length + 1,
						product_id: product?.id.toString() || '',
						quantity: 1,
						cost: cost,
						sale_price: cost, // should be from input or recalculated
						total_cost: cost * 1
					};
				} else {
					items.push({
						id: items.length + 1,
						product_id: product?.id.toString() || '',
						quantity: 1,
						cost: cost,
						sale_price: cost,
						total_cost: cost * 1
					});
				}
				activeItemIndex = null;
				lastInsertedProductId = null;
			}
		}
	});
</script>

<Card class="relative rounded-lg">
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="space-y-1.5">
				<CardTitle>Items Received</CardTitle>
				<CardDescription>Add products and quantities received</CardDescription>
			</div>
			<Button onclick={addItem}>
				<Plus />
				Add Item
			</Button>
		</div>
	</CardHeader>
	<CardContent>
		<ProductForm
			{form}
			{categories}
			{suppliers}
			bind:preSelectedSuppliers
			bind:insertedProduct
			bind:open={openProductForm}
			hasTrigger={false}
		/>
		<div class="flex flex-col gap-6">
			<Table class="border-b">
				<TableHeader>
					<TableRow>
						<TableHead>Product</TableHead>
						<TableHead>Quantity Received</TableHead>
						<TableHead>Unit Cost (₱)</TableHead>
						<TableHead>Sale Price (₱)</TableHead>
						<TableHead>Total (₱)</TableHead>
						<TableHead></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each items as item, i (item)}
						<TableRow>
							<TableCell class="w-96 align-top">
								<div>
									<Select
										name={`products.${i}.product_id`}
										onValueChange={() => onSelectProduct(i)}
										type="single"
										bind:value={items[i].product_id}
									>
										<SelectTrigger
											class={['w-full', groupedIssues[i]?.product_id ? 'border-red-500' : '']}
										>
											{getProduct(parseInt(items[i].product_id))
												? getProduct(parseInt(items[i].product_id))?.purchase_description
												: 'Select Product'}
										</SelectTrigger>
										<SelectContent>
											{#if !selectedSupplierId}
												<SelectItem value="" disabled>Please select supplier first</SelectItem>
											{:else}
												<SelectItem onclick={() => onOpenProductForm(i)} value="0">
													Add product
												</SelectItem>
												{#if !products.length}
													<SelectItem value="" disabled>No Products available</SelectItem>
												{/if}
												{#each products as product (product.id)}
													<SelectItem
														disabled={items.some(
															(item) => parseInt(item.product_id) === product.id
														)}
														value={product.id.toString()}
													>
														{product.purchase_description}
													</SelectItem>
												{/each}
											{/if}
										</SelectContent>
									</Select>
									{#if groupedIssues[i]?.product_id}
										<small class="text-red-500">
											{groupedIssues[i]?.product_id}
										</small>
									{/if}
								</div>
							</TableCell>
							<TableCell class="align-top">
								<div>
									<Input
										oninput={() => onQuantityChange(i)}
										type="number"
										name={`products.${i}.quantity`}
										bind:value={items[i].quantity}
										class={[groupedIssues[i]?.quantity ? 'border-red-500' : '']}
									/>
									{#if groupedIssues[i]?.quantity}
										<small class="text-red-500">
											{groupedIssues[i]?.quantity}
										</small>
									{/if}
								</div>
							</TableCell>
							<TableCell class="align-top">
								<Input
									class="pointer-events-none disabled:text-primary disabled:!opacity-100"
									type="number"
									name={`products.${i}.cost`}
									bind:value={items[i].cost}
								/>
							</TableCell>
							<TableCell class="align-top">
								<Input
									class="pointer-events-none disabled:text-primary disabled:!opacity-100"
									type="number"
									name={`products.${i}.sale_price`}
									bind:value={items[i].sale_price}
								/>
							</TableCell>
							<TableCell class="align-top">
								<Input
									class="pointer-events-none disabled:text-primary disabled:!opacity-100"
									type="number"
									name={`products.${i}.total_cost`}
									bind:value={items[i].total_cost}
								/>
							</TableCell>
							<TableCell class="align-top">
								<Button
									disabled={items.length === 1}
									variant="ghost"
									onclick={() => removeItem(i)}
									class="cursor-pointer text-red-500"
								>
									<Trash2 />
								</Button>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>

			<div class="w-1/2 space-y-3 self-end">
				<input type="hidden" name="sub_total" value={subTotal} />
				<input type="hidden" name="discount" value={orderDiscount} />
				<input type="hidden" name="total" value={overAllTotal} />

				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">Subtotal</span>
					<span class="font-medium">₱{subTotal}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">Discount (₱)</span>
					<div class="flex items-center gap-4">
						<Input
							type="number"
							bind:value={orderDiscount}
							class="max-w-[120px] text-right"
							placeholder="0.00"
						/>
					</div>
				</div>
				<hr />
				<div class="flex items-center justify-between">
					<span class="font-bold">Total value:</span>
					<span class="font-bold">₱{overAllTotal}</span>
				</div>
			</div>
		</div>
	</CardContent>
</Card>
