<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/input/input.svelte';
	import {
		Select,
		SelectContent,
		SelectGroup,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';
	import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import Table from '$lib/components/ui/table/table.svelte';
	import type { Supplier } from '$lib/types/global';
	import { Trash } from '@lucide/svelte';
	import z from 'zod';

	interface Props {
		disabled: boolean;
		issues: z.core.$ZodIssue[] | undefined;
		suppliers: Supplier[];
		costPerSuppliers?: { supplierId: string; cost: number | null }[];
		selectedSuppliers: Supplier[];
		preSelectedSuppliers: {
			supplierId: string;
			cost: number;
		}[];
	}

	let {
		issues,
		suppliers,
		disabled = $bindable(false),
		costPerSuppliers = $bindable(),
		selectedSuppliers = $bindable(),
		preSelectedSuppliers = $bindable([])
	}: Props = $props();
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

	costPerSuppliers = preSelectedSuppliers.length
		? (preSelectedSuppliers as { supplierId: string; cost: number }[])
		: [
				{
					supplierId: '',
					cost: null
				}
			];

	let suppliersSelected = $derived.by(() => {
		return costPerSuppliers
			.map((supplier) => suppliers.find((s) => s.id === parseInt(supplier.supplierId)))
			.filter(Boolean);
	});

	const getSupplierName = (id: number | null): string | null => {
		const supplier = suppliers.find((s) => s.id === id);
		return supplier ? supplier.name : null;
	};

	export const addSupplierCost = () => {
		costPerSuppliers.push({
			supplierId: '',
			cost: null
		});
	};

	const removeSupplierCost = (ndx: number) => {
		costPerSuppliers.splice(ndx, 1);

		groupedIssues.splice(ndx, 1);
	};

	$effect(() => {
		selectedSuppliers = suppliersSelected as Supplier[];
	});
</script>

<div class="space-x-2">
	<Table>
		<TableHeader>
			<TableRow>
				<TableHead>Supplier</TableHead>
				<TableHead>Cost (₱)</TableHead>
				<TableHead></TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each costPerSuppliers as supplier, ndx (supplier)}
				<TableRow>
					<TableCell class="align-top">
						<div>
							<Select
								{disabled}
								name={`suppliers.${ndx}.supplier_id`}
								type="single"
								bind:value={costPerSuppliers[ndx].supplierId}
							>
								<SelectTrigger
									class={[
										'w-full min-w-xs disabled:opacity-100',
										groupedIssues[ndx]?.supplier_id ? 'border-red-500' : ''
									]}
								>
									{getSupplierName(parseInt(supplier.supplierId)) ?? 'Select Supplier'}
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{#each suppliers as supplier (supplier.id)}
											<SelectItem
												disabled={selectedSuppliers.map((s) => s.id).includes(supplier.id) &&
													supplier.id !== parseInt(costPerSuppliers[ndx].supplierId)}
												value={supplier.id.toString()}
											>
												{supplier.name}
											</SelectItem>
										{/each}
									</SelectGroup>
								</SelectContent>
							</Select>
							{#if groupedIssues[ndx]?.supplier_id}
								<small class="text-red-500">
									{groupedIssues[ndx]?.supplier_id}
								</small>
							{/if}
						</div>
					</TableCell>
					<TableCell class="align-top">
						<div>
							<Input
								type="number"
								class={['disabled:opacity-100', groupedIssues[ndx]?.cost ? 'border-red-500' : '']}
								name={`suppliers.${ndx}.cost`}
								bind:value={costPerSuppliers[ndx].cost}
								placeholder="Enter cost"
								{disabled}
							/>
							{#if groupedIssues[ndx]?.cost}
								<small class="text-red-500">
									{groupedIssues[ndx]?.cost}
								</small>
							{/if}
						</div>
					</TableCell>
					<TableCell class="align-top">
						<Button
							type="button"
							disabled={costPerSuppliers.length === 1 ||
								preSelectedSuppliers
									.map((s) => s.supplierId)
									.includes(costPerSuppliers[ndx].supplierId)}
							variant="ghost"
							onclick={(e) => {
								e.preventDefault();
								removeSupplierCost(ndx);
							}}
						>
							<Trash class="text-red-500" />
						</Button>
					</TableCell>
				</TableRow>
			{/each}
		</TableBody>
	</Table>
</div>
