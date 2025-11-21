<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { ArrowLeft, CircleCheck, Printer, Save } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Table, TableBody, TableCell, TableHeader, TableRow } from '$lib/components/ui/table';
	import TableHead from '$lib/components/ui/table/table-head.svelte';
	import { Input } from '$lib/components/ui/input';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';

	let { data }: PageProps = $props();
	let physicalInventory = $derived(data.physicalInventory);
	let products = $derived(data.products);
	let physicalInventorySheetForm: HTMLFormElement;
	let status = $state((() => physicalInventory.status)());

	let items = $state(
		(() =>
			physicalInventory.items.length > 0
				? physicalInventory.items
				: products.map((product) => ({
						id: null,
						product_id: product.id,
						sku: product.sku,
						purchase_description: product.purchase_description,
						category: product.category.name,
						system_count: product.quantity,
						actual_count: 0,
						difference: 0 - parseInt(product.quantity.toString())
					})))()
	);

	const handleInputChange = (ndx: number) => {
		items[ndx].difference = items[ndx].actual_count - items[ndx].system_count;
	};

	const handleFormSubmit = async (stat: 'draft' | 'finalized') => {
		status = stat;
		setTimeout(() => physicalInventorySheetForm.requestSubmit(), 300);
	};

	const getDiffTextColor = (difference: number) => {
		if (difference === 0) {
			return 'text-gray-500';
		} else if (difference > 0) {
			return 'text-green-500';
		} else {
			return 'text-red-500';
		}
	};

	const enhanceForm: SubmitFunction = () => {
		return async ({ result }) => {
			await applyAction(result);
			if (result.type === 'success') {
				toast.success('Physical Inventory Updated Successfully');
			} else {
				toast.error('Failed to update Physical Inventory');
			}
		};
	};
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a href={resolve('/vendors/physical-inventory')} class={buttonVariants({ variant: 'ghost' })}>
				<ArrowLeft />
			</a>
			<div class="space-y-1">
				<h1 class="text-xl font-bold">{physicalInventory.title}</h1>
				<p class="text-sm text-muted-foreground">PC-00{physicalInventory.id}</p>
			</div>
		</div>
		{#if physicalInventory.status === 'draft'}
			<div class="flex items-center gap-3">
				<Button variant="outline">
					<Save />
					Save as Draft
				</Button>
				<Button onclick={() => handleFormSubmit('finalized')}>
					<CircleCheck />
					Finalized
				</Button>
			</div>
		{:else}
			<Button variant="outline">
				<Printer />
				Print
			</Button>
		{/if}
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Physical Inventory Sheet</CardTitle>
			<CardDescription>
				This is a physical inventory sheet for the product {physicalInventory.title}.
			</CardDescription>
		</CardHeader>
		<CardContent>
			<form method="post" bind:this={physicalInventorySheetForm} use:enhance={enhanceForm}>
				<input type="hidden" name="status" value={status} />
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Item</TableHead>
							<TableHead>SKU/Item code</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Sys count</TableHead>
							<TableHead>Counted</TableHead>
							<TableHead>Difference</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each items as item, ndx (item.product_id)}
							<TableRow>
								<TableCell>
									{#if physicalInventory.status === 'draft'}
										{#if item.id}
											<input type="hidden" name={`items.${ndx}.id`} value={item.id} />
										{/if}
										<input
											type="hidden"
											value={physicalInventory.id}
											name={`items.${ndx}.physical_inventory_id`}
										/>
										<input type="hidden" value={item.product_id} name={`items.${ndx}.product_id`} />
										<input
											type="hidden"
											value={item.system_count}
											name={`items.${ndx}.system_count`}
										/>
										<input type="hidden" value={item.difference} name={`items.${ndx}.difference`} />
									{/if}
									{item.purchase_description}
								</TableCell>
								<TableCell>{item.sku}</TableCell>
								<TableCell>{item.category}</TableCell>
								<TableCell class="px-5">{item.system_count}</TableCell>
								<TableCell class={[physicalInventory.status === 'finalized' ? 'px-5 !py-3' : '']}>
									{#if physicalInventory.status === 'draft'}
										<Input
											type="number"
											class="max-w-32"
											name={`items.${ndx}.actual_count`}
											bind:value={item.actual_count}
											onchange={() => handleInputChange(ndx)}
										/>
									{:else}
										{item.actual_count}
									{/if}
								</TableCell>
								<TableCell class={['px-5', getDiffTextColor(item.difference)]}>
									{item.difference > 0 ? `+${item.difference}` : item.difference}
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</form>
		</CardContent>
	</Card>
</div>
