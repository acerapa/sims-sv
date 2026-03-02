<script lang="ts">
	import PageTitle from '$lib/components/layout/PageTitle.svelte';
	import DatePicker from '$lib/components/common/DatePicker.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Printer } from '@lucide/svelte';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableFooter,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	import type { CustomerDetailRow } from '$lib/server/db/queries/reports';

	let { data }: PageProps = $props();

	let fromDate = $state<Date | undefined>(
		data.filters.from ? new Date(data.filters.from) : undefined
	);
	let toDate = $state<Date | undefined>(
		data.filters.to ? new Date(data.filters.to) : undefined
	);

	let activeTab = $state('summary');

	let summary = $derived(data.summary);
	let detail = $derived(data.detail);

	let grandTotals = $derived({
		order_count: summary.reduce((sum, row) => sum + row.order_count, 0),
		total_items: summary.reduce((sum, row) => sum + row.total_items, 0),
		total_amount: summary.reduce((sum, row) => sum + parseFloat(row.total_amount || '0'), 0)
	});

	interface GroupedCustomer {
		customer_id: number | null;
		customer_name: string;
		orders: {
			order_id: number;
			date_ordered: string;
			order_status: string;
			order_total: number;
			items: {
				product_name: string;
				product_sku: string;
				quantity: number;
				unit_price: string;
				total_price: string;
			}[];
		}[];
		subtotal: number;
	}

	function groupDetailByCustomer(rows: CustomerDetailRow[]): GroupedCustomer[] {
		const customers: GroupedCustomer[] = [];

		for (const row of rows) {
			let customer = customers.find((c) => c.customer_id === row.customer_id);
			if (!customer) {
				customer = {
					customer_id: row.customer_id,
					customer_name: row.customer_name,
					orders: [],
					subtotal: 0
				};
				customers.push(customer);
			}

			let order = customer.orders.find((o) => o.order_id === row.order_id);
			if (!order) {
				order = {
					order_id: row.order_id,
					date_ordered: row.date_ordered,
					order_status: row.order_status,
					order_total: row.order_total,
					items: []
				};
				customer.orders.push(order);
			}

			order.items.push({
				product_name: row.product_name,
				product_sku: row.product_sku,
				quantity: row.quantity,
				unit_price: row.unit_price,
				total_price: row.total_price
			});
		}

		for (const customer of customers) {
			customer.subtotal = customer.orders.reduce(
				(sum, order) => sum + (order.order_total || 0),
				0
			);
		}

		return customers;
	}

	let detailGrouped = $derived(groupDetailByCustomer(detail));

	function applyFilter() {
		const params = new URLSearchParams(page.url.searchParams);

		if (fromDate) {
			params.set('from', fromDate.toISOString().split('T')[0]);
		} else {
			params.delete('from');
		}

		if (toDate) {
			params.set('to', toDate.toISOString().split('T')[0]);
		} else {
			params.delete('to');
		}

		goto(`?${params.toString()}`, { replaceState: true });
	}

	function clearFilter() {
		fromDate = undefined;
		toDate = undefined;
		goto('?', { replaceState: true });
	}

	function openPrint() {
		const params = new URLSearchParams();
		params.set('view', activeTab);
		if (fromDate) params.set('from', fromDate.toISOString().split('T')[0]);
		if (toDate) params.set('to', toDate.toISOString().split('T')[0]);
		window.open(`/reports/sales-by-customer/print?${params.toString()}`, '_blank');
	}

	function formatCurrency(value: string | number) {
		const num = typeof value === 'string' ? parseFloat(value || '0') : value;
		return `₱${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}
</script>

<svelte:head>
	<title>RamTech | Sales by Customer</title>
	<meta name="description" content="Sales by Customer Report" />
</svelte:head>

<section class="flex flex-col gap-6">
	<PageTitle
		title="Sales by Customer"
		subTitle="View sales order totals and details grouped by customer."
	/>

	<Card>
		<CardContent class="flex items-end gap-4 pt-6">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">From</span>
				<DatePicker bind:value={fromDate} />
			</div>
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">To</span>
				<DatePicker bind:value={toDate} />
			</div>
			<Button onclick={applyFilter}>Apply Filter</Button>
			<Button variant="outline" onclick={clearFilter}>Clear</Button>
		</CardContent>
	</Card>

	<Tabs bind:value={activeTab}>
		<div class="flex items-center justify-between">
			<TabsList>
				<TabsTrigger value="summary">Summary</TabsTrigger>
				<TabsTrigger value="detail">Detail</TabsTrigger>
			</TabsList>
			<Button variant="outline" onclick={openPrint}>
				<Printer size={16} />
				Print
			</Button>
		</div>

		<TabsContent value="summary">
			<Card>
				<CardHeader>
					<CardTitle>Sales Summary by Customer</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Customer Name</TableHead>
								<TableHead class="text-right"># of Orders</TableHead>
								<TableHead class="text-right">Total Items Sold</TableHead>
								<TableHead class="text-right">Total Amount</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#if summary.length === 0}
								<TableRow>
									<TableCell colspan={4} class="text-center text-muted-foreground">
										No sales orders found for the selected date range.
									</TableCell>
								</TableRow>
							{:else}
								{#each summary as row (row.customer_id)}
									<TableRow>
										<TableCell class="font-medium">{row.customer_name}</TableCell>
										<TableCell class="text-right">{row.order_count}</TableCell>
										<TableCell class="text-right">{row.total_items}</TableCell>
										<TableCell class="text-right">
											{formatCurrency(row.total_amount)}
										</TableCell>
									</TableRow>
								{/each}
							{/if}
						</TableBody>
						{#if summary.length > 0}
							<TableFooter>
								<TableRow class="font-bold">
									<TableCell>Grand Total</TableCell>
									<TableCell class="text-right">{grandTotals.order_count}</TableCell>
									<TableCell class="text-right">{grandTotals.total_items}</TableCell>
									<TableCell class="text-right">
										{formatCurrency(grandTotals.total_amount)}
									</TableCell>
								</TableRow>
							</TableFooter>
						{/if}
					</Table>
				</CardContent>
			</Card>
		</TabsContent>

		<TabsContent value="detail">
			{#if detailGrouped.length === 0}
				<Card>
					<CardContent class="py-8 text-center text-muted-foreground">
						No sales orders found for the selected date range.
					</CardContent>
				</Card>
			{:else}
				{#each detailGrouped as customer (customer.customer_id)}
					<Card class="mb-4">
						<CardHeader>
							<CardTitle>{customer.customer_name}</CardTitle>
						</CardHeader>
						<CardContent class="space-y-6">
							{#each customer.orders as order (order.order_id)}
								<div>
									<div class="mb-2 flex items-center gap-4 text-sm text-muted-foreground">
										<span class="font-semibold text-foreground">SO-{order.order_id}</span>
										<span>
											{new Date(order.date_ordered).toLocaleDateString('default', {
												day: 'numeric',
												month: 'long',
												year: 'numeric'
											})}
										</span>
										<span class="rounded bg-muted px-2 py-0.5 text-xs capitalize">
											{order.order_status}
										</span>
									</div>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Product</TableHead>
												<TableHead class="text-right">Qty</TableHead>
												<TableHead class="text-right">Unit Price</TableHead>
												<TableHead class="text-right">Total Price</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{#each order.items as item}
												<TableRow>
													<TableCell>{item.product_name}</TableCell>
													<TableCell class="text-right">{item.quantity}</TableCell>
													<TableCell class="text-right">
														{formatCurrency(item.unit_price)}
													</TableCell>
													<TableCell class="text-right">
														{formatCurrency(item.total_price)}
													</TableCell>
												</TableRow>
											{/each}
										</TableBody>
									</Table>
								</div>
							{/each}

							<div class="flex justify-end border-t pt-2">
								<span class="mr-4 font-semibold">Subtotal:</span>
								<span class="font-bold">{formatCurrency(customer.subtotal)}</span>
							</div>
						</CardContent>
					</Card>
				{/each}
			{/if}
		</TabsContent>
	</Tabs>
</section>
