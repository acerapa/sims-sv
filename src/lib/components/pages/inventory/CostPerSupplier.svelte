<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
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
	import { Plus, Trash } from '@lucide/svelte';

	const suppliers: Supplier[] = [
		{
			id: 1,
			name: 'Supplier 1',
			email: 'supplier1@example.com',
			address: '123 Main St',
			phone_number: '123-456-7890',
			contact_person: 'John Doe',
			telephone_number: '123-456-7890'
		},
		{
			id: 2,
			name: 'Supplier 2',
			email: 'supplier2@example.com',
			address: '456 Elm St',
			phone_number: '234-567-8901',
			contact_person: 'Jane Smith',
			telephone_number: '234-567-8901'
		},
		{
			id: 3,
			name: 'Supplier 3',
			email: 'supplier3@example.com',
			address: '789 Oak St',
			phone_number: '345-678-9012',
			contact_person: 'Bob Johnson',
			telephone_number: '345-678-9012'
		},
		{
			id: 4,
			name: 'Supplier 4',
			email: 'supplier4@example.com',
			address: '101 Pine St',
			phone_number: '456-789-0123',
			contact_person: 'Alice Brown',
			telephone_number: '456-789-0123'
		},
		{
			id: 5,
			name: 'Supplier 5',
			email: 'supplier5@example.com',
			address: '202 Maple St',
			phone_number: '567-890-1234',
			contact_person: 'Charlie Green',
			telephone_number: '567-890-1234'
		}
	];

	let costPerSuppliers = $state([
		{
			supplierId: '',
			cost: 0
		}
	]);

	const getSupplierName = (id: number): string | null => {
		const supplier = suppliers.find((s) => s.id === id);
		return supplier ? supplier.name : null;
	};

	const addSupplierCost = () => {
		costPerSuppliers.push({
			supplierId: '',
			cost: 0
		});
	};
</script>

<div class="space-x-2">
	<div class="flex items-center justify-between">
		<Label>Cost per Supplier</Label>
		<Button variant="outline" onclick={addSupplierCost}>
			<Plus />
			Add Supplier Cost
		</Button>
	</div>

	<Table>
		<TableHeader>
			<TableRow>
				<TableHead>Supplier</TableHead>
				<TableHead>Cost</TableHead>
				<TableHead></TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each costPerSuppliers as supplier, ndx (ndx)}
				<TableRow>
					<TableCell>
						<Select type="single" bind:value={costPerSuppliers[ndx].supplierId}>
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
						<Input type="number" bind:value={costPerSuppliers[ndx].cost} />
					</TableCell>
					<TableCell>
						<Button
							disabled={costPerSuppliers.length === 1}
							variant="ghost"
							onclick={() => costPerSuppliers.splice(ndx, 1)}
						>
							<Trash class="text-red-500" />
						</Button>
					</TableCell>
				</TableRow>
			{/each}
			<TableRow></TableRow>
		</TableBody>
	</Table>
</div>
