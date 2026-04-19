<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
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
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { findErrorByKey } from '$lib/utils/common';
	import PackageProductsAndQuantity from './PackageProductsAndQuantity.svelte';

	interface ProductOption {
		id: number;
		sku: string;
		sales_description: string;
	}

	let {
		form,
		pkg = null,
		products,
		hasTrigger = true,
		open = $bindable<boolean>(false)
	}: {
		form: any;
		pkg?: any;
		products: ProductOption[];
		hasTrigger?: boolean;
		open?: boolean;
	} = $props();

	let edit = $state(false);
	let name = $state<string>('');
	let description = $state<string>('');
	let productRows = $state<{ product_id: string; quantity: number | null }[]>([
		{ product_id: '', quantity: 1 }
	]);
	let productsPickerRef: PackageProductsAndQuantity;

	const errors = $derived(form?.errors);
	const issues = $derived(form?.issues);

	$effect(() => {
		if (pkg) {
			name = pkg.name ?? '';
			description = pkg.description ?? '';
			productRows = pkg.packagesToProducts?.length
				? pkg.packagesToProducts.map((row: any) => ({
						product_id: row.product_id.toString(),
						quantity: row.quantity
					}))
				: [{ product_id: '', quantity: 1 }];
		}
	});

	$effect(() => {
		if (!open) {
			name = '';
			description = '';
			productRows = [{ product_id: '', quantity: 1 }];
			edit = false;
			if (form) form = null;
		}
	});

	const clearPackageId = async () => {
		if (page.url.pathname === '/vendors/packages') {
			await goto(resolve('/vendors/packages'));
		}
	};

	const handleAddProduct = () => {
		productsPickerRef.addRow();
	};

	const submitForm: SubmitFunction = () => {
		return async ({ result }) => {
			await applyAction(result);
			if (result.type === 'success') {
				toast.success(edit ? 'Package updated successfully' : 'Package added successfully');
				open = false;
				await invalidate('vendors:packages');
			} else {
				const message = result.type === 'failure' ? result.data?.message : null;
				toast.error(message || (edit ? 'Failed to update package' : 'Failed to add package'));
			}
		};
	};

	const handleFormClose = (state: boolean) => {
		if (page.url.pathname === '/vendors/packages' && !state) {
			clearPackageId();
		}
	};
</script>

<Sheet bind:open onOpenChangeComplete={(e) => handleFormClose(e)}>
	{#if hasTrigger}
		<SheetTrigger
			onclick={clearPackageId}
			class="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
		>
			<Plus class="size-4" />
			Add Package
		</SheetTrigger>
	{/if}

	<SheetContent
		trapFocus={false}
		side="right"
		class="overflow-x-hidden overflow-y-auto sm:!max-w-2xl"
	>
		<SheetHeader class="mt-5 flex-row items-center justify-between">
			<div class="space-y-1">
				<SheetTitle>{pkg ? 'Package Details' : 'Add New Package'}</SheetTitle>
				<SheetDescription>
					Group products into a bundle that can be added to sales orders at once.
				</SheetDescription>
			</div>
			{#if pkg}
				{#if edit}
					<Button onclick={() => (edit = false)} variant="outline">Cancel</Button>
				{:else}
					<Button onclick={() => (edit = true)}>Edit Package</Button>
				{/if}
			{/if}
		</SheetHeader>
		<form
			action={`/vendors/packages?/${edit ? 'updatePackage' : 'addPackage'}`}
			method="post"
			use:enhance={submitForm}
		>
			{#if pkg}
				<input type="hidden" name="id" value={pkg.id} />
			{/if}
			<div class="flex flex-col gap-6 px-6">
				<Card>
					<CardHeader>
						<CardTitle>Package Details</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex flex-col gap-6">
							<div class="space-y-2">
								<Label>Name</Label>
								<div>
									<Input
										disabled={!!pkg && !edit}
										bind:value={name}
										class={[
											'disabled:opacity-100',
											errors?.properties?.name ? 'border-red-500' : ''
										]}
										type="text"
										name="name"
										placeholder="e.g. Starter Kit"
									/>
									{#if errors?.properties?.name}
										<small class="text-red-500">{errors.properties.name.errors[0]}</small>
									{/if}
								</div>
							</div>
							<div class="space-y-2">
								<Label>Description</Label>
								<div>
									<Textarea
										disabled={!!pkg && !edit}
										bind:value={description}
										name="description"
										class="disabled:opacity-100"
										placeholder="Optional description for this package"
									/>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div class="flex items-center justify-between">
							<CardTitle>Products</CardTitle>
							{#if !pkg || edit}
								<Button variant="outline" type="button" onclick={handleAddProduct}>
									<Plus />
									Add Product
								</Button>
							{/if}
						</div>
					</CardHeader>
					<CardContent>
						<PackageProductsAndQuantity
							bind:this={productsPickerRef}
							bind:rows={productRows}
							disabled={!!pkg && !edit}
							{products}
							issues={findErrorByKey(issues, 'products')}
						/>
						{#if errors?.properties?.products?.errors?.[0]}
							<small class="text-red-500">{errors.properties.products.errors[0]}</small>
						{/if}
					</CardContent>
				</Card>
				<Separator />
			</div>
			{#if !pkg || edit}
				<SheetFooter class="flex flex-row justify-end">
					<Button type="button" onclick={() => (open = false)} variant="outline">Cancel</Button>
					<Button type="submit" variant="default">
						{edit ? 'Update Package' : 'Add Package'}
					</Button>
				</SheetFooter>
			{/if}
		</form>
	</SheetContent>
</Sheet>
