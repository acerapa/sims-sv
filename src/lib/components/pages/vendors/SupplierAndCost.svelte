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

	interface Props {
		suppliers: Supplier[];
	}

	let { suppliers }: Props = $props();

	let costPerSuppliers = $state([
		{
			supplierId: '',
			cost: 0
		}
	]);

	let selectedSuppliers = $derived.by(() => {
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
			cost: 0
		});
	};

	const removeSupplierCost = (ndx: number) => {
		costPerSuppliers.splice(ndx, 1);
	};
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
			{#each costPerSuppliers as supplier, ndx (ndx)}
				<TableRow>
					<TableCell>
						<Select
							name={`suppliers.${ndx}.supplier_id`}
							type="single"
							bind:value={costPerSuppliers[ndx].supplierId}
						>
							<SelectTrigger class="w-full min-w-xs">
								{getSupplierName(parseInt(supplier.supplierId)) ?? 'Select Supplier'}
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{#each suppliers as supplier (supplier.id)}
										<SelectItem value={supplier.id.toString()}>
											{supplier.name}
										</SelectItem>
									{/each}
								</SelectGroup>
							</SelectContent>
						</Select>
					</TableCell>
					<TableCell>
						<Input
							type="number"
							name={`suppliers.${ndx}.cost`}
							bind:value={costPerSuppliers[ndx].cost}
						/>
					</TableCell>
					<TableCell>
						<Button
							type="button"
							disabled={costPerSuppliers.length === 1}
							variant="ghost"
							onclick={() => removeSupplierCost(ndx)}
						>
							<Trash class="text-red-500" />
						</Button>
					</TableCell>
				</TableRow>
			{/each}
		</TableBody>
	</Table>
</div>
