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
	import { Textarea } from '$lib/components/ui/textarea';
	import type { Product, Supplier } from '$lib/types/global';
	import type { PageProps } from './$types';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import SelectProduct from '$lib/components/pages/vendors/receive-po/SelectProduct.svelte';
	import { findErrorByKey } from '$lib/utils/common';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import SupplierForm from '$lib/components/pages/vendors/suppliers/SupplierForm.svelte';

	let { data, form }: PageProps = $props();

	let errors = $derived(form?.errors);
	let issues = $derived(form?.issues);
	let openSupplierForm = $state(false);
	let insertedSupplier = $state<Supplier | null>(null);
	let suppliers = $derived<Supplier[]>(data.suppliers);
	let products = $state<Product[]>([]);
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

	let selectProductRef: SelectProduct;
	let items = $state([
		{
			id: 0,
			product_id: '',
			quantity: 1,
			cost: 0,
			total_cost: 0
		}
	]);

	const submitForm: SubmitFunction = async () => {
		return async ({ result }) => {
			await applyAction(result);
			if (result.type === 'success') {
				toast.success('Purchase order received successfully');
				goto(resolve('/vendors/inventory'));
			} else {
				toast.error('Failed to receive purchase order');
			}
		};
	};

	$effect(() => {
		if (selectedSupplierId && selectedSupplierId !== '-' && fetchProductsForm) {
			fetchProductsForm.requestSubmit();
		}

		if (insertedSupplier) {
			selectedSupplierId = insertedSupplier.id.toString();
			suppliers.unshift(insertedSupplier);
			insertedSupplier = null;
		}
	});
</script>

<svelte:head>
	<title>RamTech | Receive Purchase Order</title>
	<meta name="description" content="Receive Purchase Order Page" />
</svelte:head>

<div class="mb-6 flex flex-col gap-6">
	<SupplierForm bind:open={openSupplierForm} {form} bind:insertedSupplier hasTrigger={false} />
	<form
		bind:this={fetchProductsForm}
		method="post"
		action="?/getProductBySupplier"
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'success') {
					products = result.data?.products as Product[];

					items = items.filter((item) => {
						return products.some((product) => product.id === parseInt(item.product_id));
					});

					if (items.length === 0) {
						selectProductRef.addItem();
					}
				}
			};
		}}
		class="hidden"
	>
		<input type="hidden" name="supplier_id" value={selectedSupplierId} />
	</form>
	<form class="flex flex-col gap-6" method="post" action="?/receivePo" use:enhance={submitForm}>
		<Card class="rounded-lg">
			<CardHeader>
				<CardTitle>Purchase Order Details</CardTitle>
				<CardDescription>Enter the details of the received shipment</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="flex flex-col gap-6">
					<div class="flex flex-wrap gap-6">
						<div class="flex flex-1 flex-col gap-2">
							<Label>PO Reference</Label>
							<div>
								<Input
									class={[errors?.properties?.reference ? 'border-red-500' : '', 'h-10']}
									name="reference"
									placeholder="e.g, PO-2024-0001"
								/>
								{#if errors?.properties?.reference}
									<small class="text-red-500">{errors.properties.reference.errors[0]}</small>
								{/if}
							</div>
						</div>
						<div class="flex flex-1 flex-col gap-2">
							<Label>Supplier</Label>
							<div>
								<Select type="single" name="supplier_id" bind:value={selectedSupplierId}>
									<SelectTrigger
										class={['h-10 w-full', errors?.properties?.supplier_id ? 'border-red-500' : '']}
									>
										{selectedSupplier ? selectedSupplier.name : 'Select Supplier'}
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectItem onclick={() => (openSupplierForm = true)} value="-">
												Add new supplier
											</SelectItem>
										</SelectGroup>
										<SelectGroup>
											{#each suppliers as supplier (supplier.id)}
												<SelectItem value={supplier.id.toString()}>{supplier.name}</SelectItem>
											{/each}
										</SelectGroup>
									</SelectContent>
								</Select>
								{#if errors?.properties?.supplier_id}
									<small class="text-red-500">
										{errors.properties.supplier_id.errors[0]}
									</small>
								{/if}
							</div>
						</div>
					</div>
					<div class="flex flex-wrap gap-6">
						<div class="flex flex-1 flex-col gap-2">
							<Label>Date Received</Label>
							<div class="flex flex-col gap-1">
								<DatePicker
									error={errors?.properties?.receive_date ? true : false}
									name="receive_date"
								/>
								{#if errors?.properties?.receive_date}
									<small class="text-red-500">
										{errors.properties.receive_date.errors[0]}
									</small>
								{/if}
							</div>
						</div>
						<div class="flex flex-1 flex-col gap-2">
							<Label>Received Type</Label>
							<div>
								<Select type="single" name="receive_type" bind:value={selectedReceiveType}>
									<SelectTrigger
										class={[
											'h-10 w-full',
											errors?.properties?.receive_type ? 'border-red-500' : ''
										]}
									>
										{selectedReceiveTypelabel ? selectedReceiveTypelabel : 'Select Type'}
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectItem value="with_pay">With Pay</SelectItem>
											<SelectItem value="without_pay">Without Pay</SelectItem>
										</SelectGroup>
									</SelectContent>
								</Select>
								{#if errors?.properties?.receive_type}
									<small class="text-red-500">
										{errors.properties.receive_type.errors[0]}
									</small>
								{/if}
							</div>
						</div>
					</div>
					<div class="flex flex-1 flex-col gap-2">
						<Label>Notes</Label>
						<Textarea
							name="notes"
							class="h-10"
							placeholder="Add any additional notes about this shipment..."
						/>
					</div>
				</div>
			</CardContent>
		</Card>

		<SelectProduct
			bind:items
			{products}
			bind:this={selectProductRef}
			{selectedSupplierId}
			issues={findErrorByKey(issues, 'products')}
		/>
		<div class="flex gap-3 self-end">
			<Button variant="outline">Cancel</Button>
			<Button type="submit">Receive Items</Button>
		</div>
	</form>
</div>
