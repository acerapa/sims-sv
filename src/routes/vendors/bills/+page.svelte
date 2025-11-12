<script lang="ts">
	import BillForm from '$lib/components/pages/vendors/bills/BillForm.svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Table, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Search } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import type { Supplier } from '$lib/types/global';

	let { data }: PageProps = $props();
	const suppliers = $derived<Supplier[]>(data?.suppliers);
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="space-y-2">
				<CardTitle>Bills</CardTitle>
				<CardDescription>Manage bills</CardDescription>
			</div>
			<BillForm {suppliers} />
		</div>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="relative">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input type="search" placeholder="Search bills..." class="h-10 pl-9" />
		</div>

		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Bill No.</TableHead>
					<TableHead>Supplier</TableHead>
					<TableHead>Linked PO</TableHead>
					<TableHead>Bill Date</TableHead>
					<TableHead>Due Date</TableHead>
					<TableHead>Total Amount</TableHead>
					<TableHead>Amount Paid</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Actions</TableHead>
				</TableRow>
			</TableHeader>
		</Table>
	</CardContent>
</Card>
