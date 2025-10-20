<script lang="ts">
	import SupplierForm from '$lib/components/pages/vendors/suppliers/SupplierForm.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Ellipsis, Plus, Search } from '@lucide/svelte';

	const suppliers = [
		{
			name: 'Supplier A',
			contact: 'John Doe',
			email: 'john@example.com',
			phone: '123-456-7890',
			products: 10
		},
		{
			name: 'Supplier B',
			contact: 'Jane Smith',
			email: 'jane@example.com',
			phone: '987-654-3210',
			products: 5
		},
		{
			name: 'Supplier C',
			contact: 'Bob Johnson',
			email: 'bob@example.com',
			phone: '555-555-5555',
			products: 8
		},
		{
			name: 'Supplier D',
			contact: 'Alice Brown',
			email: 'alice@example.com',
			phone: '111-222-3333',
			products: 12
		}
	];

	let openSupplierForm = $state(false);
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="space-y-2">
				<CardTitle>Suppliers</CardTitle>
				<CardDescription>Manage your supplier relationships</CardDescription>
			</div>
			<Button class="flex items-center gap-3" onclick={() => (openSupplierForm = true)}>
				<Plus />
				<span>Add Supplier</span>
			</Button>
		</div>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="relative">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input type="search" placeholder="Search suppliers..." class="h-10 pl-9" />
		</div>

		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Supplier</TableHead>
					<TableHead>Contact</TableHead>
					<TableHead>Email</TableHead>
					<TableHead>Phone</TableHead>
					<TableHead class="text-center"># of Products</TableHead>
					<TableHead>Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each suppliers as supplier, ndx (ndx)}
					<TableRow>
						<TableCell>{supplier.name}</TableCell>
						<TableCell>{supplier.contact}</TableCell>
						<TableCell>{supplier.email}</TableCell>
						<TableCell>{supplier.phone}</TableCell>
						<TableCell class="text-center">{supplier.products}</TableCell>
						<TableCell>
							<Button variant="ghost" size="sm">
								<Ellipsis />
							</Button>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</CardContent>
</Card>
<SupplierForm bind:open={openSupplierForm} />
