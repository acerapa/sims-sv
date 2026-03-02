<script lang="ts">
	import PrintReportLayout from '$lib/components/common/PrintReportLayout.svelte';
	import type { PageProps } from './$types';
	import type { CustomerDetailRow } from '$lib/server/db/queries/reports';

	let { data }: PageProps = $props();

	let summary = $derived(data.summary);
	let detail = $derived(data.detail);
	let view = $derived(data.view);

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

	function formatCurrency(value: string | number) {
		const num = typeof value === 'string' ? parseFloat(value || '0') : value;
		return `₱${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('default', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Print - Sales by Customer</title>
</svelte:head>

<PrintReportLayout
	reportTitle={view === 'detail' ? 'Sales by Customer — Detail' : view === 'both' ? 'Sales by Customer' : 'Sales by Customer — Summary'}
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
					{#each summary as row (row.customer_id)}
						<tr>
							<td>{row.customer_name}</td>
							<td class="text-right">{row.order_count}</td>
							<td class="text-right">{row.total_items}</td>
							<td class="text-right">{formatCurrency(row.total_amount)}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
			{#if summary.length > 0}
				<tfoot>
					<tr>
						<td>Grand Total</td>
						<td class="text-right">{grandTotals.order_count}</td>
						<td class="text-right">{grandTotals.total_items}</td>
						<td class="text-right">{formatCurrency(grandTotals.total_amount)}</td>
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
		{#if detailGrouped.length === 0}
			<p style="text-align: center; color: #666; padding: 2rem 0;">
				No sales orders found for the selected date range.
			</p>
		{:else}
			{#each detailGrouped as customer, cIdx (customer.customer_id)}
				<h3 class="print-section-title" class:page-break={cIdx > 0 && view === 'detail'}>
					{customer.customer_name}
				</h3>

				{#each customer.orders as order (order.order_id)}
					<div class="print-po-header">
						<span class="po-ref">SO-{order.order_id}</span>
						<span>{formatDate(order.date_ordered)}</span>
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
							{#each order.items as item}
								<tr>
									<td>{item.product_name}</td>
									<td class="text-right">{item.quantity}</td>
									<td class="text-right">{formatCurrency(item.unit_price)}</td>
									<td class="text-right">{formatCurrency(item.total_price)}</td>
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
