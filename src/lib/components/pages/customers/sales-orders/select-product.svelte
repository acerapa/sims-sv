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
	import type { Product } from '$lib/types/global';
	import { Plus, ScanBarcode, Trash2 } from '@lucide/svelte';
	import z from 'zod';
	import { toast } from 'svelte-sonner';

	interface Props {
		issues: z.core.$ZodIssue[] | undefined;
		products: Product[];
		items: {
			id: number;
			product_id: string;
			quantity: number;
			unit_price: number;
			total_price: number;
			serial_number: string;
		}[];
	}

	let { products, items = $bindable(), issues }: Props = $props();

	let barcodeInput = $state('');
	let barcodeInputEl = $state<HTMLInputElement | null>(null);

	const onBarcodeScan = () => {
		const barcode = barcodeInput.trim();
		if (!barcode) return;

		const product = products.find((p) => p.item_code === barcode);

		if (!product) {
			toast.error('Product not found for barcode: ' + barcode);
			barcodeInput = '';
			barcodeInputEl?.focus();
			return;
		}

		const existingIndex = items.findIndex((item) => parseInt(item.product_id) === product.id);

		if (existingIndex !== -1) {
			items[existingIndex].quantity += 1;
			items[existingIndex].total_price =
				items[existingIndex].quantity * items[existingIndex].unit_price;
		} else {
			const price =
				typeof product.sale_price === 'string'
					? parseFloat(product.sale_price)
					: product.sale_price || 0;

			// replace first empty row, or add a new one
			const emptyIndex = items.findIndex((item) => !item.product_id);
			if (emptyIndex !== -1) {
				items[emptyIndex].product_id = product.id.toString();
				items[emptyIndex].unit_price = price;
				items[emptyIndex].total_price = items[emptyIndex].quantity * price;
			} else {
				items.push({
					id: items.length + 1,
					product_id: product.id.toString(),
					quantity: 1,
					unit_price: price,
					total_price: price,
					serial_number: ''
				});
			}
		}

		barcodeInput = '';
		barcodeInputEl?.focus();
	};

	let subTotal = $derived.by(() => {
		return items
			.map((item) => item.total_price)
			.filter(Boolean)
			.reduce((acc, curr) => acc + curr, 0)
			.toFixed(2);
	});

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
			unit_price: 0,
			total_price: 0,
			serial_number: ''
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
			const price =
				typeof product.sale_price === 'string'
					? parseFloat(product.sale_price)
					: product.sale_price || 0;
			item.unit_price = price;
			item.total_price = item.quantity * price;
		}
	};

	const onQuantityChange = (ndx: number) => {
		const item = items[ndx];
		item.total_price = item.quantity * item.unit_price;
	};
</script>

<Card class="relative rounded-lg">
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="space-y-1.5">
				<CardTitle>Order Items</CardTitle>
				<CardDescription>Add products to this sales order</CardDescription>
			</div>
			<Button onclick={addItem}>
				<Plus />
				Add Item
			</Button>
		</div>
		<div class="relative">
			<ScanBarcode class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				bind:ref={barcodeInputEl}
				bind:value={barcodeInput}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						onBarcodeScan();
					}
				}}
				type="text"
				placeholder="Scan or type barcode..."
				class="pl-9"
			/>
		</div>
	</CardHeader>
	<CardContent>
		<div class="flex flex-col gap-6">
			<Table class="border-b">
				<TableHeader>
					<TableRow>
						<TableHead>Product</TableHead>
						<TableHead>S/N</TableHead>
						<TableHead>Quantity</TableHead>
						<TableHead>Unit Price (₱)</TableHead>
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
												? getProduct(parseInt(items[i].product_id))?.sales_description
												: 'Select Product'}
										</SelectTrigger>
										<SelectContent>
											{#if !products.length}
												<SelectItem value="" disabled>No Products available</SelectItem>
											{/if}
											{#each products as product (product.id)}
												<SelectItem
													disabled={items.some((item) => parseInt(item.product_id) === product.id)}
													value={product.id.toString()}
												>
													{product.sales_description}
												</SelectItem>
											{/each}
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
								<Input
									type="text"
									placeholder="Optional"
									name={`products.${i}.serial_number`}
									bind:value={items[i].serial_number}
								/>
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
									name={`products.${i}.unit_price`}
									bind:value={items[i].unit_price}
								/>
							</TableCell>
							<TableCell class="align-top">
								<Input
									class="pointer-events-none disabled:text-primary disabled:!opacity-100"
									type="number"
									name={`products.${i}.total_price`}
									bind:value={items[i].total_price}
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
				<input type="hidden" name="total_cost" value={subTotal} />

				<div class="flex items-center justify-between">
					<span class="font-bold">Total:</span>
					<span class="font-bold">₱{subTotal}</span>
				</div>
			</div>
		</div>
	</CardContent>
</Card>
