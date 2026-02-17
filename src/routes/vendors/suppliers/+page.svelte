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
	import { Ellipsis, Search } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import type { Supplier } from '$lib/types/global';

	let { form, data }: PageProps = $props();
	const suppliers = $derived<Supplier[]>(data.suppliers);
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="space-y-2">
				<CardTitle>Suppliers</CardTitle>
				<CardDescription>Manage your supplier relationships</CardDescription>
			</div>
			<SupplierForm {form} />
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
					<TableHead>Telephone</TableHead>
					<TableHead class="text-center"># of Products</TableHead>
					<TableHead>Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each suppliers as supplier (supplier.id)}
					<TableRow>
						<TableCell>{supplier.name}</TableCell>
						<TableCell>{supplier.contact_person}</TableCell>
						<TableCell>{supplier.email || '-'}</TableCell>
						<TableCell>{supplier.phone_number || '-'}</TableCell>
						<TableCell>{supplier.telephone_number || '-'}</TableCell>
						<TableCell class="text-center">{0}</TableCell>
						<TableCell>
							<Button variant="ghost" size="sm">
								<Ellipsis />
							</Button>
						</TableCell>
					</TableRow>
				{/each}
				{#if suppliers.length === 0}
					<TableRow>
						<TableCell colspan={7} class="text-center text-muted-foreground">
							No suppliers found!
						</TableCell>
					</TableRow>
				{/if}
			</TableBody>
		</Table>
	</CardContent>
</Card>
