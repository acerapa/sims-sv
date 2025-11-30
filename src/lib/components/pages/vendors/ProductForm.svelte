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
	import { applyAction, enhance } from '$app/forms';
	import SupplierAndCost from './SupplierAndCost.svelte';
	import type { Product, Supplier } from '$lib/types/global';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { findErrorByKey } from '$lib/utils/common';
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';

	let {
		form,
		suppliers,
		categories,
		product = null,
		hasTrigger = true,
		open = $bindable<boolean>(false),
		preSelectedSuppliers = $bindable([]),
		insertedProduct = $bindable<Product | undefined>(undefined)
	} = $props();

	let preferredSupplierId = $state(product?.preferred_supplier_id || '');
	let selectedSuppliers = $state<Supplier[]>([]);
	let isSameDescription = $state(false);
	let purchase_description = $state('');
	let sales_description = $state('');

	const errors = $derived(form?.errors);
	const issues = $derived(form?.issues);
	const preferredSupplier = $derived.by(() =>
		suppliers.find((s: Supplier) => s.id.toString() === preferredSupplierId)
	);

	let selectSupplierAndCostRef: SupplierAndCost;

	const handleAddSupplier = () => {
		selectSupplierAndCostRef.addSupplierCost();
	};

	const handlePurchaseDescriptionInput = () => {
		if (isSameDescription) {
			sales_description = purchase_description;
		}
	};

	const handleSalesDescriptionInput = () => {
		if (isSameDescription) {
			purchase_description = sales_description;
		}
	};

	const clearProductId = async () => {
		preSelectedSuppliers = [];
		await goto(resolve('/vendors/inventory'));
	};

	const formEnchance: SubmitFunction = async () => {
		return async ({ result }) => {
			await applyAction(result);
			if (result.type === 'success') {
				insertedProduct = result.data;
				toast.success('Product added successfully');
				open = false;
				await invalidate('vendors');
			} else {
				toast.error('Failed to add product');
			}
		};
	};

	$effect(() => {
		if (!open) {
			preferredSupplierId = '';
			purchase_description = '';
			sales_description = '';
			isSameDescription = false;

			if (form) {
				form = null;
			}
		}

		if (selectedSuppliers.length === 0) {
			preferredSupplierId = '';
		}
	});
</script>

<Sheet bind:open>
	{#if hasTrigger}
		<SheetTrigger
			onclick={clearProductId}
			class="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
		>
			<Plus class="size-4" />
			Add Product
		</SheetTrigger>
	{/if}

	<SheetContent
		trapFocus={false}
		side="right"
		class="overflow-x-hidden overflow-y-auto sm:!max-w-2xl"
	>
		<SheetHeader>
			<SheetTitle>Add New Product</SheetTitle>
			<SheetDescription>
				Fill in the details to add a new product to your inventory
			</SheetDescription>
		</SheetHeader>
		<form action="/vendors/inventory" method="post" use:enhance={formEnchance}>
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
										disabled={product ? true : false}
										value={product?.sku}
										class={[
											'disabled:opacity-100',
											errors?.properties?.sku ? 'border-red-500' : ''
										]}
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
										disabled={product ? true : false}
										type="number"
										name="quantity"
										placeholder="Enter quantity"
										value={product?.quantity}
										class={[
											'disabled:opacity-100',
											errors?.properties?.quantity ? 'border-red-500' : ''
										]}
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
										class={[
											'disabled:opacity-100',
											errors?.properties?.minimum_quantity ? 'border-red-500' : ''
										]}
										type="number"
										name="minimum_quantity"
										disabled={product ? true : false}
										value={product?.minimum_quantity}
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
								<div>
									<Input
										class={[
											'disabled:opacity-100',
											errors?.properties?.sale_price ? 'border-red-500' : ''
										]}
										type="number"
										name="sale_price"
										value={product?.sale_price}
										disabled={product ? true : false}
										placeholder="e,.g,. 1000"
									/>
									{#if errors?.properties?.sale_price}
										<small class="text-red-500">{errors.properties.sale_price.errors[0]}</small>
									{/if}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<div class="flex items-center justify-between">
							<CardTitle>Suppliers and Costs</CardTitle>
							{#if !product}
								<Button variant="outline" type="button" onclick={handleAddSupplier}>
									<Plus />
									Add Supplier
								</Button>
							{/if}
						</div>
					</CardHeader>
					<CardContent>
						<div class="flex flex-col gap-6">
							<SupplierAndCost
								bind:preSelectedSuppliers
								bind:selectedSuppliers
								bind:this={selectSupplierAndCostRef}
								{suppliers}
								issues={findErrorByKey(issues, 'suppliers')}
							/>
							<div class="space-y-2">
								<Label>Preferred Supplier</Label>
								<div>
									<Select
										disabled={!selectedSuppliers.length}
										type="single"
										name="preferred_supplier_id"
										bind:value={preferredSupplierId}
									>
										<SelectTrigger
											class={[errors?.properties?.sale_price ? 'border-red-500' : '', 'w-full']}
										>
											{preferredSupplier ? preferredSupplier.name : 'Select Preferred Supplier'}
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{#each selectedSuppliers as supplier (supplier.id)}
													<SelectItem value={supplier.id.toString()} label={supplier.name}>
														{supplier.name}
													</SelectItem>
												{/each}
											</SelectGroup>
										</SelectContent>
									</Select>
									{#if errors?.properties?.preferred_supplier_id}
										<small class="text-red-500">
											{errors.properties.preferred_supplier_id.errors[0]}
										</small>
									{/if}
								</div>
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
							<div class="flex items-center gap-1">
								<Checkbox id="same-value" bind:checked={isSameDescription} />
								<Label for="same-value">Is same value?</Label>
							</div>
							<div class="space-y-2">
								<Label>Item Description - Purchase</Label>
								<div>
									<Textarea
										name="purchase_description"
										class={errors?.properties?.purchase_description ? 'border-red-500' : ''}
										bind:value={purchase_description}
										oninput={handlePurchaseDescriptionInput}
										placeholder="Description for purchase orders and receiving..."
									/>
									{#if errors?.properties?.purchase_description && !isSameDescription}
										<small class="text-red-500">
											{errors.properties.purchase_description.errors[0]}
										</small>
									{/if}
								</div>
							</div>
							<div class="space-y-2">
								<Label class={isSameDescription ? 'opacity-50' : ''}>Item Description - Sales</Label
								>
								<div>
									<Textarea
										readonly={isSameDescription}
										name="sales_description"
										class={!isSameDescription && errors?.properties?.sales_description
											? 'border-red-500'
											: ''}
										bind:value={sales_description}
										oninput={handleSalesDescriptionInput}
										placeholder="Description for sales and customer-facing documents..."
									/>
									{#if errors?.properties?.sales_description && !isSameDescription}
										<small class="text-red-500">
											{errors.properties.sales_description.errors[0]}
										</small>
									{/if}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
				<Separator />
			</div>
			<SheetFooter class="flex flex-row justify-end">
				<Button
					type="button"
					onclick={() => {
						open = false;
					}}
					variant="outline">Cancel</Button
				>
				<Button type="submit" variant="default">Add Product</Button>
			</SheetFooter>
		</form>
	</SheetContent>
</Sheet>
