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
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Ellipsis, Eye, Search } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import type { Supplier } from '$lib/types/global';
	import { buttonVariants } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { data, form }: PageProps = $props();
	let bill = $derived(data?.bill);

	const suppliers = $derived<Supplier[]>(data?.suppliers);
	let openBillForm = $state(false);

	const onViewBill = async (billId: number) => {
		openBillForm = true;
		await goto(resolve(`/vendors/bills?id=${billId}` as '/vendors/bills'));
	};
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="space-y-2">
				<CardTitle>Bills</CardTitle>
				<CardDescription>Manage bills</CardDescription>
			</div>
			<BillForm bind:open={openBillForm} {bill} {form} {suppliers} />
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
			<TableBody>
				{#if data.bills.length}
					{#each data.bills as bill (bill.id)}
						<TableRow>
							<TableCell>BILL-00{bill.id}</TableCell>
							<TableCell>{bill.supplier_name}</TableCell>
							<TableCell>{bill.po_reference}</TableCell>
							<TableCell>
								{bill.bill_date.toLocaleString('default', {
									day: 'numeric',
									month: 'long',
									year: 'numeric'
								})}
							</TableCell>
							<TableCell>
								{bill.due_date.toLocaleString('default', {
									day: 'numeric',
									month: 'long',
									year: 'numeric'
								})}
							</TableCell>
							<TableCell>₱{parseFloat(bill.total_amount).toFixed(2)}</TableCell>
							<TableCell>₱{parseFloat(bill.paid_amount).toFixed(2)}</TableCell>
							<TableCell class="capitalize">
								{bill.bill_status}
							</TableCell>
							<TableCell>
								<DropdownMenu>
									<DropdownMenuTrigger class={buttonVariants({ variant: 'ghost', size: 'sm' })}>
										<Ellipsis />
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<DropdownMenuItem onSelect={() => onViewBill(bill.id)} class="space-x-2">
											<Eye />
											<span>View</span>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</TableCell>
						</TableRow>
					{/each}
				{:else}
					<TableRow>
						<TableCell colspan={9} class="text-center text-muted-foreground">
							No bills found!
						</TableCell>
					</TableRow>
				{/if}
			</TableBody>
		</Table>
	</CardContent>
</Card>
