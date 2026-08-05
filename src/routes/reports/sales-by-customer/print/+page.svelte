<script lang="ts">
	import PrintReportLayout from '$lib/components/common/PrintReportLayout.svelte';
	import type { PageProps } from './$types';
	import type { CustomerDetailRow } from '$lib/server/db/queries/reports';
	import { formatCurrency } from '$lib/utils/common';
	import { formatDate } from '$lib/utils/printables';

	let { data }: PageProps = $props();

	let summary = $derived(data.summary);
	let detailed = $derived(data.detailed);
	let view = $derived(data.view);

	let grandTotals = $derived({
		order_count: summary.reduce((sum, row) => sum + row.order_count, 0),
		total_items: summary.reduce((sum, row) => sum + row.total_items, 0),
		total_amount: summary.reduce((sum, row) => sum + parseFloat(row.total_amount || '0'), 0)
	});

</script>

<svelte:head>
	<title>Print - Sales by Customer</title>
</svelte:head>

<PrintReportLayout
	reportTitle={view === 'detail'
		? 'Sales by Customer — Detail'
		: view === 'both'
			? 'Sales by Customer'
			: 'Sales by Customer — Summary'}
	dateRange={data.filters}
>
	{#if view === 'summary' || view === 'both'}
		<table class="print-table">
			<thead>
				<tr>
					<th>Customer Name</th>
					<th class="text-right"># of Orders</th>
					<th class="text-right">Total Items Sold</th>
					<th class="text-right">Total Amount</th>
				</tr>
			</thead>
			<tbody>
				{#if summary.length === 0}
					<tr>
						<td colspan="4" style="text-align: center; color: #666;">
							No sales orders found for the selected date range.
						</td>
					</tr>
				{:else}
					{#each summary as row (row.customer_name)}
						<tr>
							<td>{row.customer_name}</td>
							<td class="text-right">{row.total_orders}</td>
							<td class="text-right">{row.total_items}</td>
							<td class="text-right">{formatCurrency(row.total_sales)}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
			{#if summary.length > 0}
				<tfoot>
					<tr>
						<td>Grand Total</td>
						<td class="text-right">
							{summary.reduce((acc, row) => Number(acc) + Number(row.total_orders), 0)}
						</td>
						<td class="text-right">
							{summary.reduce((acc, row) => Number(acc) + Number(row.total_items), 0)}
						</td>
						<td class="text-right">
							{formatCurrency(
								summary.reduce((acc, row) => Number(acc) + Number(row.total_sales), 0)
							)}
						</td>
					</tr>
				</tfoot>
			{/if}
		</table>
	{/if}

	{#if view === 'both'}
		<div class="page-break"></div>
		<h3 class="print-section-title" style="margin-top: 0;">Detail</h3>
	{/if}

	{#if view === 'detail' || view === 'both'}
		{#if detailed.length === 0}
			<p style="text-align: center; color: #666; padding: 2rem 0;">
				No sales orders found for the selected date range.
			</p>
		{:else}
			{#each detailed as customer, cIdx (customer.customer_name)}
				<h3 class="print-section-title" class:page-break={cIdx > 0 && view === 'detail'}>
					{customer.customer_name}
				</h3>

				{#each customer.orders as order (order.sales_order_id)}
					<div class="print-po-header">
						<span class="po-ref">SO-{order.sales_order_id}</span>
						<span>{formatDate(order.date_ordered.toLocaleString())}</span>
						<span style="text-transform: capitalize;">{order.order_status}</span>
					</div>
					<table class="print-table">
						<thead>
							<tr>
								<th>Product</th>
								<th class="text-right">Qty</th>
								<th class="text-right">Unit Price</th>
								<th class="text-right">Total Price</th>
							</tr>
						</thead>
						<tbody>
							{#each order.items as item (item.product_name)}
								<tr>
									<td>{item.product_name}</td>
									<td class="text-right">{item.item_quantity}</td>
									<td class="text-right">{formatCurrency(item.item_price)}</td>
									<td class="text-right">{formatCurrency(item.item_total)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/each}

				<p class="print-vendor-subtotal">
					Subtotal: {formatCurrency(customer.subtotal)}
				</p>
			{/each}
		{/if}
	{/if}
</PrintReportLayout>
