<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
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
	import { Funnel, Search } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let invoices = $derived(data.invoices);

	let searchValue = $state('');

	const getStatusVariant = (status: string) => {
		switch (status) {
			case 'unpaid':
				return 'default';
			case 'partially_paid':
				return 'outline';
			case 'paid':
				return 'secondary';
			case 'cancelled':
				return 'destructive';
			default:
				return 'outline';
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'unpaid':
				return 'Unpaid';
			case 'partially_paid':
				return 'Partially Paid';
			case 'paid':
				return 'Paid';
			case 'cancelled':
				return 'Cancelled';
			default:
				return status;
		}
	};
</script>

<svelte:head>
	<title>RamTech | Invoices</title>
	<meta name="description" content="Manage invoices" />
</svelte:head>

<div class="flex flex-col gap-6">
	<Card>
		<CardHeader class="flex items-center justify-between">
			<div class="space-y-1">
				<CardTitle class="text-lg">Invoices</CardTitle>
				<CardDescription>Track invoices and payments</CardDescription>
			</div>
			<div class="flex space-x-3">
				<Button variant="outline" class="space-x-2">
					<Funnel />
					<span>Filter</span>
				</Button>
			</div>
		</CardHeader>
		<CardContent class="flex flex-col gap-4">
			<div class="relative">
				<Input
					type="search"
					class="h-10 pl-9"
					placeholder="Search invoices..."
					value={searchValue}
				/>
				<Search class="absolute top-1/2 left-3 size-4 translate-y-[-50%] text-muted-foreground" />
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Invoice #</TableHead>
						<TableHead>Sales Order</TableHead>
						<TableHead>Customer</TableHead>
						<TableHead>Invoice Date</TableHead>
						<TableHead>Due Date</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Total</TableHead>
						<TableHead>Paid</TableHead>
						<TableHead>Balance</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each invoices as invoice (invoice.id)}
						<TableRow>
							<TableCell class="font-medium">
								<a href="/customers/invoices/{invoice.id}" class="text-blue-500 hover:underline">
									INV-{invoice.id}
								</a>
							</TableCell>
							<TableCell>SO-{invoice.sales_order_id}</TableCell>
							<TableCell>{invoice.customer_name}</TableCell>
							<TableCell>
								{new Date(invoice.invoice_date).toLocaleDateString('default', {
									day: 'numeric',
									month: 'short',
									year: 'numeric'
								})}
							</TableCell>
							<TableCell>
								{new Date(invoice.due_date).toLocaleDateString('default', {
									day: 'numeric',
									month: 'short',
									year: 'numeric'
								})}
							</TableCell>
							<TableCell>
								<Badge variant={getStatusVariant(invoice.invoice_status || 'unpaid')}>
									{getStatusLabel(invoice.invoice_status || 'unpaid')}
								</Badge>
							</TableCell>
							<TableCell class="font-medium">
								₱{parseFloat(invoice.total_amount as string).toLocaleString()}
							</TableCell>
							<TableCell>
								₱{parseFloat(invoice.paid_amount as string).toLocaleString()}
							</TableCell>
							<TableCell class="font-medium">
								₱{(
									parseFloat(invoice.total_amount as string) -
									parseFloat(invoice.paid_amount as string)
								).toLocaleString()}
							</TableCell>
						</TableRow>
					{/each}
					{#if invoices.length === 0}
						<TableRow>
							<TableCell colspan={9} class="text-center text-muted-foreground">
								No invoices found
							</TableCell>
						</TableRow>
					{/if}
				</TableBody>
			</Table>
		</CardContent>
	</Card>
</div>
