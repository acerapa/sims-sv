<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Select,
		SelectContent,
		SelectGroup,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import {
		Sheet,
		SheetContent,
		SheetDescription,
		SheetFooter,
		SheetHeader,
		SheetTitle,
		SheetTrigger
	} from '$lib/components/ui/sheet';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Plus } from '@lucide/svelte';
	import SelectCategory from './categories/SelectCategory.svelte';
	import { enhance } from '$app/forms';
	import SupplierAndCost from './SupplierAndCost.svelte';
	import type { ActionData } from '../../../../routes/vendors/inventory/$types';
	import type { Category, Supplier } from '$lib/types/global';

	interface Props {
		open?: boolean;
		categories: Category[];
		suppliers: Supplier[];
		form: ActionData | null;
	}
	let { open = $bindable(), categories, suppliers, form }: Props = $props();

	let preferredSupplier = $state('');
	const errors = $derived(form?.errors);

	let selectSupplierAndCostRef: SupplierAndCost;

	const handleAddSupplier = () => {
		selectSupplierAndCostRef.addSupplierCost();
	};

	$inspect(form).with(console.log);
</script>

<Sheet>
	<SheetTrigger
		class="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
	>
		<Plus class="size-4" />
		Add Product
	</SheetTrigger>
	<SheetContent side="right" class="overflow-x-hidden overflow-y-auto sm:!max-w-2xl">
		<SheetHeader>
			<SheetTitle>Add New Product</SheetTitle>
			<SheetDescription>
				Fill in the details to add a new product to your inventory
			</SheetDescription>
		</SheetHeader>
		<form method="post" use:enhance>
			<div class="flex flex-col gap-6 px-6">
				<Card>
					<CardHeader>
						<CardTitle>Product Details</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex flex-col gap-6">
							<div class="space-y-2">
								<Label>Item Code / SKU</Label>
								<div>
									<Input
										class={errors?.properties?.sku ? 'border-red-500' : ''}
										type="text"
										name="sku"
										placeholder="e,.g,, WH-2025-0001"
									/>
									{#if errors?.properties?.sku}
										<small class="text-red-500">{errors.properties.sku.errors[0]}</small>
									{/if}
								</div>
							</div>
							<div class="space-y-2">
								<Label>Category</Label>
								<div>
									<SelectCategory error={errors?.properties?.category_id?.errors} {categories} />
									{#if errors?.properties?.category_id}
										<small class="text-red-500">{errors.properties.category_id.errors[0]}</small>
									{/if}
								</div>
							</div>
							<div class="space-y-2">
								<Label>Quantity</Label>
								<div>
									<Input
										class={errors?.properties?.quantity ? 'border-red-500' : ''}
										type="number"
										name="quantity"
										placeholder="Enter quantity"
									/>
									{#if errors?.properties?.quantity}
										<small class="text-red-500">{errors.properties.quantity.errors[0]}</small>
									{/if}
								</div>
							</div>
							<div class="space-y-2">
								<Label>Minimum Quantity</Label>
								<div>
									<Input
										class={errors?.properties?.minimum_quantity ? 'border-red-500' : ''}
										type="number"
										value="0"
										name="minimum_quantity"
										placeholder="Enter minimum quantity"
									/>
									{#if errors?.properties?.minimum_quantity}
										<small class="text-red-500"
											>{errors.properties.minimum_quantity.errors[0]}</small
										>
									{/if}
								</div>
							</div>
							<div class="space-y-2">
								<Label>Sale Price (₱)</Label>
								<Input type="number" value="0" name="sale_price" placeholder="e,.g,. 1000" />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<div class="flex items-center justify-between">
							<CardTitle>Suppliers and Costs</CardTitle>
							<Button variant="outline" type="button" onclick={handleAddSupplier}>
								<Plus />
								Add Supplier
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<div class="flex flex-col gap-6">
							<SupplierAndCost bind:this={selectSupplierAndCostRef} {suppliers} />
							<div class="space-y-2">
								<Label>Preferred Supplier</Label>
								<Select type="single" name="preferred_supplier_id" bind:value={preferredSupplier}>
									<SelectTrigger class="w-full">
										{preferredSupplier ? preferredSupplier : 'Select Preferred Supplier'}
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{#each suppliers as supplier (supplier.id)}
												<SelectItem value={supplier.id.toString()} label={supplier.name}>
													{supplier.name}
												</SelectItem>
											{/each}
										</SelectGroup>
									</SelectContent>
								</Select>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Descriptions</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex flex-col gap-6">
							<div class="space-y-2">
								<Label>Item Description - Purchase</Label>
								<Textarea
									name="purchase_description"
									placeholder="Description for purchase orders and receiving..."
								/>
							</div>
							<div class="space-y-2">
								<Label>Item Description - Sales</Label>
								<Textarea
									name="sales_description"
									placeholder="Description for sales and customer-facing documents..."
								/>
							</div>
						</div>
					</CardContent>
				</Card>
				<Separator />
			</div>
			<SheetFooter class="flex flex-row justify-end">
				<Button type="button" variant="outline">Cancel</Button>
				<Button type="submit" variant="default">Add Product</Button>
			</SheetFooter>
		</form>
	</SheetContent>
</Sheet>
