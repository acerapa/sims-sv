<script lang="ts">
	import PageTitle from '$lib/components/layout/PageTitle.svelte';
	import DatePicker from '$lib/components/common/DatePicker.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Printer } from '@lucide/svelte';
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
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { formatCurrency } from '$lib/utils/common';

	let { data }: PageProps = $props();

	let fromDate = $state<Date | undefined>(
		data.filters.from ? new Date(data.filters.from) : undefined
	);
	let toDate = $state<Date | undefined>(
		data.filters.to ? new Date(data.filters.to) : undefined
	);

	let activeTab = $state('summary');

	let summary = $derived(data.summary);
	let detailed = $derived(data.detailed);

	function applyFilter() {
		const params = new SvelteURLSearchParams(page.url.searchParams);

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
		const params = new SvelteURLSearchParams();
		params.set('view', activeTab);
		if (fromDate) params.set('from', fromDate.toISOString().split('T')[0]);
		if (toDate) params.set('to', toDate.toISOString().split('T')[0]);
		window.open(`/reports/sales-by-customer/print?${params.toString()}`, '_blank');
	}
</script>

<svelte:head>
	<title>RamTech | Sales by Customer</title>
	<meta name="description" content="Sales by Customer Report" />
</svelte:head>

<section class="flex flex-col gap-6">
    <div class="flex flex-col gap-1">
        <Button href="/reports" variant="ghost" class="w-fit text-muted-foreground hover:bg-slate-50 hover:text-black !pl-0 cursor-pointer ">
            <ArrowLeft />
            <span class="text-sm">Back to Reports</span>
        </Button>
    	<PageTitle
    		title="Sales by Customer"
    		subTitle="View sales order totals and details grouped by customer."
    	/>
    </div>

	<Card>
		<CardContent class="flex items-end gap-4">
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
								{#each summary as row (row.customer_name)}
									<TableRow>
										<TableCell class="font-medium">{row.customer_name}</TableCell>
										<TableCell class="text-right">{row.total_orders}</TableCell>
										<TableCell class="text-right">{row.total_items}</TableCell>
										<TableCell class="text-right">
											{formatCurrency(row.total_sales)}
										</TableCell>
									</TableRow>
								{/each}
							{/if}
						</TableBody>
						{#if summary.length > 0}
							<TableFooter>
								<TableRow class="font-bold">
									<TableCell>Grand Total</TableCell>
									<TableCell class="text-right">
										{summary.reduce((acc, row) => Number(acc) + Number(row.total_orders), 0)}
									</TableCell>
									<TableCell class="text-right">
										{summary.reduce((acc, row) => Number(acc) + Number(row.total_items), 0)}
									</TableCell>
									<TableCell class="text-right">
										{formatCurrency(summary.reduce((acc, row) => Number(acc) + Number(row.total_sales), 0))}
									</TableCell>
								</TableRow>
							</TableFooter>
						{/if}
					</Table>
				</CardContent>
			</Card>
		</TabsContent>

		<TabsContent value="detail">
			<Card>
				<CardHeader>
					<CardTitle>Sales Detail by Customer</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Type</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>Num</TableHead>
								<TableHead>Item</TableHead>
								<TableHead class="text-right">Qty</TableHead>
								<TableHead class="text-right">Sales Price</TableHead>
								<TableHead class="text-right">Amount</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#if detailed.length === 0}
								<TableRow>
									<TableCell colspan={7} class="text-center text-muted-foreground">
										No sales orders found for the selected date range.
									</TableCell>
								</TableRow>
							{:else}
								{#each detailed as customer (customer.customer_name)}
									<TableRow class="bg-muted/50 hover:bg-muted/50">
										<TableCell colspan={7} class="py-2 font-bold">
											{customer.customer_name}
										</TableCell>
									</TableRow>
									{#each customer.orders as order (order.sales_order_id)}
										{#each order.items as item (item.product_name)}
											<TableRow>
												<TableCell class="pl-8 text-muted-foreground">Invoice</TableCell>
												<TableCell>
													{new Date(order.date_ordered).toLocaleDateString('default', {
														day: '2-digit',
														month: '2-digit',
														year: 'numeric'
													})}
												</TableCell>
												<TableCell>{order.sales_order_id}</TableCell>
												<TableCell>{item.product_name}</TableCell>
												<TableCell class="text-right">{item.item_quantity}</TableCell>
												<TableCell class="text-right">
													{formatCurrency(item.item_price)}
												</TableCell>
												<TableCell class="text-right">
													{formatCurrency(item.item_total)}
												</TableCell>
											</TableRow>
										{/each}
									{/each}
									<TableRow class="border-t hover:bg-transparent">
										<TableCell colspan={6} class="py-1 pl-8 text-sm font-semibold">
											Total {customer.customer_name}
										</TableCell>
										<TableCell class="py-1 text-right font-semibold">
											{formatCurrency(customer.subtotal)}
										</TableCell>
									</TableRow>
								{/each}
							{/if}
						</TableBody>
						{#if detailed.length > 0}
							<TableFooter>
								<TableRow class="font-bold">
									<TableCell colspan={6}>TOTAL</TableCell>
									<TableCell class="text-right">
										{formatCurrency(detailed.reduce((acc, order) => Number(acc) + Number(order.subtotal), 0))}
									</TableCell>
								</TableRow>
							</TableFooter>
						{/if}
					</Table>
				</CardContent>
			</Card>
		</TabsContent>
	</Tabs>
</section>
