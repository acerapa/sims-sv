<script lang="ts">
	import DatePicker from '$lib/components/common/DatePicker.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { PageProps } from './$types';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { data, form }: PageProps = $props();

	let errors = $derived((form as any)?.errors);
	let salesOrder = $derived(data.salesOrder);

	// Track which items are selected for invoicing and their quantities
	let selectedItems = $state<
		{
			selected: boolean;
			sales_order_item_id: number;
			product_id: number;
			product_name: string;
			max_quantity: number;
			quantity: number;
			unit_price: number;
			total_price: number;
		}[]
	>([]);

	// Initialize selected items from sales order items (only uninvoiced quantities)
	$effect(() => {
		if (salesOrder?.items && selectedItems.length === 0) {
			selectedItems = salesOrder.items
				.filter((item) => {
					const remaining = item.quantity - parseInt(item.invoiced_quantity as any);
					return remaining > 0;
				})
				.map((item) => {
					const remaining = item.quantity - parseInt(item.invoiced_quantity as any);
					const unitPrice =
						typeof item.unit_price === 'string'
							? parseFloat(item.unit_price)
							: item.unit_price || 0;
					return {
						selected: true,
						sales_order_item_id: item.id,
						product_id: item.product_id,
						product_name: item.product_name,
						max_quantity: remaining,
						quantity: remaining,
						unit_price: unitPrice,
						total_price: remaining * unitPrice
					};
				});
		}
	});

	let totalAmount = $derived.by(() => {
		return selectedItems
			.filter((item) => item.selected)
			.reduce((acc, item) => acc + item.total_price, 0)
			.toFixed(2);
	});

	const onQuantityChange = (ndx: number) => {
		const item = selectedItems[ndx];
		if (item.quantity > item.max_quantity) {
			item.quantity = item.max_quantity;
		}
		if (item.quantity < 0) {
			item.quantity = 0;
		}
		item.total_price = item.quantity * item.unit_price;
	};

	const submitForm: SubmitFunction = async () => {
		return async ({ result }) => {
			if (result.type === 'success') {
				toast.success('Invoice created successfully');
				goto(resolve('/customers/invoices'));
			} else {
				await applyAction(result);
				toast.error('Failed to create invoice');
			}
		};
	};

	// Build the items to submit (only selected ones with quantity > 0)
	let itemsToSubmit = $derived(
		selectedItems.filter((item) => item.selected && item.quantity > 0)
	);
</script>

<svelte:head>
	<title>RamTech | Create Invoice</title>
	<meta name="description" content="Create invoice from sales order" />
</svelte:head>

<div class="mb-6 flex flex-col gap-6">
	<form
		class="flex flex-col gap-6"
		method="post"
		action="?/createInvoice"
		use:enhance={submitForm}
	>
		<input type="hidden" name="sales_order_id" value={salesOrder.id} />
		<input type="hidden" name="total_amount" value={totalAmount} />

		<Card class="rounded-lg">
			<CardHeader>
				<CardTitle>Create Invoice</CardTitle>
				<CardDescription>
					Creating invoice for Sales Order SO-{salesOrder.id} — {salesOrder.customer_name}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="flex flex-col gap-6">
					<div class="flex flex-wrap gap-6">
						<div class="flex flex-1 flex-col gap-2">
							<Label>Customer</Label>
							<Input value={salesOrder.customer_name} disabled class="disabled:text-primary disabled:!opacity-100" />
						</div>
						<div class="flex flex-1 flex-col gap-2">
							<Label>Sales Order</Label>
							<Input value="SO-{salesOrder.id}" disabled class="disabled:text-primary disabled:!opacity-100" />
						</div>
					</div>
					<div class="flex flex-wrap gap-6">
						<div class="flex flex-1 flex-col gap-2">
							<Label>Invoice Date</Label>
							<div class="flex flex-col gap-1">
								<DatePicker
									error={errors?.properties?.invoice_date ? true : false}
									name="invoice_date"
								/>
								{#if errors?.properties?.invoice_date}
									<small class="text-red-500">
										{errors.properties.invoice_date.errors[0]}
									</small>
								{/if}
							</div>
						</div>
						<div class="flex flex-1 flex-col gap-2">
							<Label>Due Date</Label>
							<div class="flex flex-col gap-1">
								<DatePicker
									error={errors?.properties?.due_date ? true : false}
									name="due_date"
								/>
								{#if errors?.properties?.due_date}
									<small class="text-red-500">
										{errors.properties.due_date.errors[0]}
									</small>
								{/if}
							</div>
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<Label>Notes</Label>
						<Textarea
							name="notes"
							class="h-10"
							placeholder="Add any additional notes about this invoice..."
						/>
					</div>
				</div>
			</CardContent>
		</Card>

		<Card class="rounded-lg">
			<CardHeader>
				<div class="flex items-center justify-between">
					<div class="space-y-1.5">
						<CardTitle>Invoice Items</CardTitle>
						<CardDescription>Select items from the sales order to include in this invoice</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div class="flex flex-col gap-6">
					<Table class="border-b">
						<TableHeader>
							<TableRow>
								<TableHead class="w-12">Include</TableHead>
								<TableHead>Product</TableHead>
								<TableHead>Ordered Qty</TableHead>
								<TableHead>Already Invoiced</TableHead>
								<TableHead>Invoice Qty</TableHead>
								<TableHead>Unit Price (₱)</TableHead>
								<TableHead>Total (₱)</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each selectedItems as item, i (item.sales_order_item_id)}
								<TableRow>
									<TableCell class="align-top">
										<Checkbox bind:checked={selectedItems[i].selected} />
									</TableCell>
									<TableCell class="align-top">
										{item.product_name}
									</TableCell>
									<TableCell class="align-top">
										{@const soItem = salesOrder.items.find(
											(si) => si.id === item.sales_order_item_id
										)}
										{soItem?.quantity || 0}
									</TableCell>
									<TableCell class="align-top">
										{@const soItem = salesOrder.items.find(
											(si) => si.id === item.sales_order_item_id
										)}
										{parseInt(soItem?.invoiced_quantity as any) || 0}
									</TableCell>
									<TableCell class="align-top">
										<Input
											oninput={() => onQuantityChange(i)}
											type="number"
											bind:value={selectedItems[i].quantity}
											min={0}
											max={item.max_quantity}
											disabled={!item.selected}
										/>
									</TableCell>
									<TableCell class="align-top">
										{item.unit_price.toFixed(2)}
									</TableCell>
									<TableCell class="align-top font-medium">
										₱{item.selected ? item.total_price.toFixed(2) : '0.00'}
									</TableCell>
								</TableRow>
							{/each}
							{#if selectedItems.length === 0}
								<TableRow>
									<TableCell colspan={7} class="text-center text-muted-foreground">
										All items in this sales order have already been invoiced
									</TableCell>
								</TableRow>
							{/if}
						</TableBody>
					</Table>

					<!-- Hidden inputs for selected items -->
					{#each itemsToSubmit as item, i (item.sales_order_item_id)}
						<input type="hidden" name={`items.${i}.sales_order_item_id`} value={item.sales_order_item_id} />
						<input type="hidden" name={`items.${i}.product_id`} value={item.product_id} />
						<input type="hidden" name={`items.${i}.quantity`} value={item.quantity} />
						<input type="hidden" name={`items.${i}.unit_price`} value={item.unit_price} />
						<input type="hidden" name={`items.${i}.total_price`} value={item.total_price} />
					{/each}

					<div class="w-1/2 space-y-3 self-end">
						<div class="flex items-center justify-between">
							<span class="font-bold">Total:</span>
							<span class="font-bold">₱{totalAmount}</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>

		<div class="flex gap-3 self-end">
			<Button variant="outline" href="/customers/sales-orders">Cancel</Button>
			<Button type="submit" disabled={itemsToSubmit.length === 0}>Create Invoice</Button>
		</div>
	</form>
</div>
