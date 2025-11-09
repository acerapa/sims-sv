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
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Select,
		SelectContent,
		SelectGroup,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { Product, Supplier } from '$lib/types/global';
	import { Plus, Trash2 } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';

	let { data }: PageProps = $props();

	let suppliers = $derived<Supplier[]>(data.suppliers);
	let products = $derived<Product[]>([]);
	let fetchProductsForm: HTMLFormElement;
	let selectedSupplierId = $state<string>('');
	let selectedSupplier = $derived(
		suppliers.find((supplier) => supplier.id === parseInt(selectedSupplierId))
	);
	let selectedReceiveType = $state<string>('');
	let selectedReceiveTypelabel = $derived.by(() => {
		switch (selectedReceiveType) {
			case 'with_pay':
				return 'With Pay';
			case 'without_pay':
				return 'Without Pay';
			default:
				return null;
		}
	});

	const items = $state([
		{
			id: 0,
			product_id: '',
			quantity: 0,
			cost: 0,
			total_cost: 0
		}
	]);

	const addItem = () => {
		items.push({
			id: items.length + 1,
			product_id: '',
			quantity: 0,
			cost: 0,
			total_cost: 0
		});
	};

	const removeItem = (index: number) => {
		items.splice(index, 1);
	};

	$effect(() => {
		if (selectedSupplierId && fetchProductsForm) {
			fetchProductsForm.requestSubmit();
		}
	});
</script>

<svelte:head>
	<title>RamTech | Receive Purchase Order</title>
	<meta name="description" content="Receive Purchase Order Page" />
</svelte:head>

<div class="flex flex-col gap-6">
	<form
		bind:this={fetchProductsForm}
		method="post"
		action="?/getProductBySupplier"
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'success') {
					products = result.data?.products as Product[];
				}
			};
		}}
		class="hidden"
	>
		<input type="hidden" name="supplier_id" value={selectedSupplierId} />
	</form>
	<Card class="rounded-lg">
		<CardHeader>
			<CardTitle>Purchase Order Details</CardTitle>
			<CardDescription>Enter the details of the received shipment</CardDescription>
		</CardHeader>
		<CardContent>
			<form class="flex flex-col gap-6">
				<div class="flex flex-wrap gap-6">
					<div class="flex flex-1 flex-col gap-2">
						<Label>PO Reference</Label>
						<Input class="h-10" name="reference" placeholder="e.g, PO-2024-0001" />
					</div>
					<div class="flex flex-1 flex-col gap-2">
						<Label>Supplier</Label>
						<Select type="single" name="supplier_id" bind:value={selectedSupplierId}>
							<SelectTrigger class="h-10 w-full">
								{selectedSupplier ? selectedSupplier.name : 'Select Supplier'}
							</SelectTrigger>
							<SelectContent>
								{#each suppliers as supplier (supplier.id)}
									<SelectItem value={supplier.id.toString()}>{supplier.name}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</div>
				</div>
				<div class="flex flex-wrap gap-6">
					<div class="flex flex-1 flex-col gap-2">
						<Label>Date Received</Label>
						<DatePicker name="receive_date" />
					</div>
					<div class="flex flex-1 flex-col gap-2">
						<Label>Received Type</Label>
						<Select type="single" name="receive_type" bind:value={selectedReceiveType}>
							<SelectTrigger class="h-10 w-full">
								{selectedReceiveTypelabel ? selectedReceiveTypelabel : 'Select Type'}
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="with_pay">With Pay</SelectItem>
									<SelectItem value="without_pay">Without Pay</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				</div>
				<div class="flex flex-1 flex-col gap-2">
					<Label>Notes</Label>
					<Textarea class="h-10" placeholder="Add any additional notes about this shipment..." />
				</div>
			</form>
		</CardContent>
	</Card>

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
			<div class="flex flex-col gap-6">
				<Table class="border-b">
					<TableHeader>
						<TableRow>
							<TableHead>Product</TableHead>
							<TableHead>Quantity Received</TableHead>
							<TableHead>Unit Cost</TableHead>
							<TableHead>Total</TableHead>
							<TableHead></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each items as item, i (item)}
							<TableRow>
								<TableCell>
									<Select type="single" bind:value={items[i].product_id}>
										<SelectTrigger class="w-full">Select Product</SelectTrigger>
										<SelectContent>
											{#if !selectedSupplierId}
												<SelectItem value="" disabled>Please select supplier first</SelectItem>
											{:else}
												{#if !products.length}
													<SelectItem value="" disabled>No Products available</SelectItem>
												{/if}
												{#each products as product (product.id)}
													<SelectItem value={product.id.toString()}>
														{product.purchase_description}
													</SelectItem>
												{/each}
											{/if}
										</SelectContent>
									</Select>
								</TableCell>
								<TableCell>
									<Input type="number" bind:value={items[i].quantity} />
								</TableCell>
								<TableCell>
									<Input type="number" bind:value={items[i].cost} />
								</TableCell>
								<TableCell>
									<p class="font-semibold">₱0.00</p>
								</TableCell>
								<TableCell>
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
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Subtotal</span>
						<span class="font-medium">₱0.00</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Discount</span>
						<div class="flex items-center gap-4">
							<Input type="number" class="max-w-[120px] text-right" placeholder="0.00" />
							<span class="font-medium">₱0.00</span>
						</div>
					</div>
					<hr />
					<div class="flex items-center justify-between">
						<span class="font-bold">Total value:</span>
						<span class="font-bold">₱0.00</span>
					</div>
				</div>
			</div>
		</CardContent>
	</Card>

	<div class="flex gap-3 self-end">
		<Button variant="outline">Cancel</Button>
		<Button>Receive Items</Button>
	</div>
</div>
