<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import CustomerBillForm from '$lib/components/pages/customers/bills/CustomerBillForm.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Banknote, Ellipsis, Eye, Search } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';

	let { data, form }: PageProps = $props();

	let openBillForm = $state(false);
	let bill = $derived(data.bill ?? null);

	const onViewBill = (billId: number) => {
		openBillForm = true;
		goto(resolve(`/customers/bills?id=${billId}` as '/customers/bills'));
	};

	type StatusFilter = 'unpaid' | 'partially_paid' | 'paid' | 'all';

	let searchValue = $state('');
	let statusFilter = $state<StatusFilter>('all');

	let bills = $derived.by(() => {
		return data.bills.filter((bill) => {
			const matchesSearch = bill.customer_name.toLowerCase().includes(searchValue.toLowerCase());
			const matchesStatus = statusFilter === 'all' || bill.invoice_status === statusFilter;
			return matchesSearch && matchesStatus;
		});
	});

	// Ledger position: what is still receivable on the bills shown
	let receivableTotal = $derived(
		data.bills
			.filter((bill) => bill.invoice_status !== 'paid')
			.reduce((sum, bill) => sum + bill.balance, 0)
	);
	let openCount = $derived(data.bills.filter((bill) => bill.invoice_status !== 'paid').length);

	const formatMoney = (value: number | string | null) => {
		if (value == null) value = '0';
		return `₱${parseFloat(String(value)).toLocaleString()}`;
	};

	const formatDate = (value: Date | string) => {
		return new Date(value).toLocaleDateString('default', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	};

	const getStatusVariant = (status: string | null) => {
		switch (status) {
			case 'unpaid':
				return 'default';
			case 'partially_paid':
				return 'outline';
			case 'paid':
				return 'secondary';
			default:
				return 'outline';
		}
	};

	const getStatusLabel = (status: string | null) => {
		switch (status) {
			case 'unpaid':
				return 'Unpaid';
			case 'partially_paid':
				return 'Partially Paid';
			case 'paid':
				return 'Paid';
			default:
				return status;
		}
	};

	const goToBill = (billId: number) => {
		location.href = resolve(`/customers/invoices/${billId}` as '/customers/invoices/1');
	};
</script>

<svelte:head>
	<title>RamTech | Bills</title>
	<meta name="description" content="Track payments received against customer invoices" />
</svelte:head>

<div class="flex flex-col gap-6">
	<Card>
		<CardHeader class="flex items-center justify-between">
			<div class="space-y-1">
				<CardTitle class="text-lg">Bills</CardTitle>
				<CardDescription>Track payments received against customer invoices</CardDescription>
			</div>
			<div class="flex items-center gap-3">
				<Badge variant="secondary" class="font-semibold">
					{openCount} outstanding · {formatMoney(receivableTotal)}
				</Badge>
				<CustomerBillForm bind:open={openBillForm} {bill} {form} customers={data.customers} />
			</div>
		</CardHeader>
		<CardContent class="flex flex-col gap-4">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div class="relative flex-1 sm:max-w-xs">
					<Input
						type="search"
						class="h-10 pl-9"
						placeholder="Search customer..."
						bind:value={searchValue}
					/>
					<Search class="absolute top-1/2 left-3 size-4 translate-y-[-50%] text-muted-foreground" />
				</div>
				<div class="flex gap-1">
					<Button
						variant={statusFilter === 'all' ? 'default' : 'outline'}
						size="sm"
						class="capitalize"
						onclick={() => (statusFilter = 'all')}
					>
						All
					</Button>
					<Button
						variant={statusFilter === 'unpaid' ? 'default' : 'outline'}
						size="sm"
						class="capitalize"
						onclick={() => (statusFilter = 'unpaid')}
					>
						Unpaid
					</Button>
					<Button
						variant={statusFilter === 'partially_paid' ? 'default' : 'outline'}
						size="sm"
						class="capitalize"
						onclick={() => (statusFilter = 'partially_paid')}
					>
						Partial
					</Button>
					<Button
						variant={statusFilter === 'paid' ? 'default' : 'outline'}
						size="sm"
						class="capitalize"
						onclick={() => (statusFilter = 'paid')}
					>
						Paid
					</Button>
				</div>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Invoice #</TableHead>
						<TableHead>Customer</TableHead>
						<TableHead>Sales Order</TableHead>
						<TableHead>Invoice Date</TableHead>
						<TableHead>Due Date</TableHead>
						<TableHead>Total</TableHead>
						<TableHead>Paid</TableHead>
						<TableHead>Balance</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if bills.length}
						{#each bills as bill (bill.id)}
							<TableRow class={bill.invoice_status === 'unpaid' ? 'bg-destructive/5' : ''}>
								<TableCell class="font-medium">
									<a
										href={resolve(`/customers/invoices/${bill.id}` as '/customers/invoices/1')}
										class="text-blue-500 hover:underline"
									>
										INV-{bill.id}
									</a>
								</TableCell>
								<TableCell>{bill.customer_name}</TableCell>
								<TableCell>
									<a
										href={resolve(
											`/customers/sales-orders/${bill.sales_order_id}` as '/customers/sales-orders/1'
										)}
										class="text-blue-500 hover:underline"
									>
										SO-{bill.sales_order_id}
									</a>
								</TableCell>
								<TableCell>{formatDate(bill.invoice_date)}</TableCell>
								<TableCell>{formatDate(bill.due_date)}</TableCell>
								<TableCell>{formatMoney(bill.total_amount)}</TableCell>
								<TableCell>{formatMoney(bill.paid_amount)}</TableCell>
								<TableCell class="font-medium">{formatMoney(bill.balance)}</TableCell>
								<TableCell>
									<Badge variant={getStatusVariant(bill.invoice_status)}>
										{getStatusLabel(bill.invoice_status)}
									</Badge>
								</TableCell>
								<TableCell>
									<DropdownMenu>
										<DropdownMenuTrigger class={buttonVariants({ variant: 'ghost', size: 'sm' })}>
											<Ellipsis />
										</DropdownMenuTrigger>
										<DropdownMenuContent>
											<DropdownMenuItem onselect={() => onViewBill(bill.id)} class="space-x-2">
												<Eye />
												<span>View bill</span>
											</DropdownMenuItem>
											<DropdownMenuItem onselect={() => onViewBill(bill.id)} class="space-x-2">
												<Banknote />
												<span>Record payment</span>
											</DropdownMenuItem>
											<DropdownMenuItem onselect={() => goToBill(bill.id)} class="space-x-2">
												<Eye />
												<span>Open invoice</span>
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						{/each}
					{:else}
						<TableRow>
							<TableCell colspan={10} class="text-center text-muted-foreground">
								No bills found
							</TableCell>
						</TableRow>
					{/if}
				</TableBody>
			</Table>
		</CardContent>
	</Card>
</div>
