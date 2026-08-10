<script lang="ts">
	import PrintReportLayout from '$lib/components/common/PrintReportLayout.svelte';
	import { formatCurrency } from '$lib/utils/common';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();

	let summary = $derived(data.summary);
	let detailed = $derived(data.detailed);
	let view = $derived(data.view);

	let grandTotal = $derived.by(() => {
		const combinedSales = summary.map((item) => item.sales).flat();
		return combinedSales.reduce((acc, sales) => acc + (sales ? sales?.total_cost : 0), 0);
	});
</script>

<svelte:head>
	<title>Print - Open Sales by Customer</title>
</svelte:head>

<PrintReportLayout
	reportTitle={view === 'detail'
		? 'Open Sales by Customer — Detail'
		: view === 'both'
			? 'Open Sales by Customer'
			: 'Open Sales by Customer — Summary'}
	dateRange={data.filters}
>
	{#if view === 'summary' || view === 'both'}
		<table class="print-table border-none">
			<thead>
				<tr>
					<th>Customer</th>
					<th>Date</th>
					<th>SO Number</th>
					<th>Notes</th>
					<th class="text-right">Amount</th>
				</tr>
			</thead>
			<tbody>
				{#if summary.length > 0}
					{#each summary as sale (sale.customer)}
						<tr>
							<td colspan={5}>
								<p class="font-bold">{sale.customer}</p>
							</td>
						</tr>
						{#each sale.sales as item (item.sales_order_id)}
							<tr>
								<td class="!pl-5">Sales Order</td>
								<td>
									{new Date(item.date_ordered).toLocaleDateString('default', {
										day: 'numeric',
										month: 'long',
										year: 'numeric'
									})}
								</td>
								<td>{item.sales_order_id}</td>
								<td>{item.notes || '-'}</td>
								<td class="text-right">{formatCurrency(item.total_cost)}</td>
							</tr>
						{/each}
						<tr>
							<td colspan={4}>
								<p class="font-bold">{sale.customer} Total:</p>
							</td>
							<td class="text-right font-bold">{formatCurrency(sale.total)}</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan={5}>
							<p>No data available.</p>
						</td>
					</tr>
				{/if}
			</tbody>
			<tfoot>
				<tr>
					<td colspan={4} class="!border-r-0">
						<p class="font-bold">Grand Total:</p>
					</td>
					<td class="!border-l-0 text-right font-bold">{formatCurrency(grandTotal)}</td>
				</tr>
			</tfoot>
		</table>
	{/if}

	{#if view === 'both'}
		<div class="page-break"></div>
		<h3 class="print-section-title" style="margin-top: 0;">Detail</h3>
	{/if}

	{#if view === 'detailed' || view === 'both'}
		<table class="print-table">
			<thead>
				<tr>
					<th>Item</th>
					<th>Quantity</th>
					<th class="text-right">Cost</th>
					<th class="text-right">Total</th>
				</tr>
			</thead>
			<tbody>
				{#if detailed.length > 0}
					{#each detailed as openSale (openSale)}
						<tr>
							<td colspan={4}>
								<p class="font-bold">{openSale.customer}</p>
							</td>
						</tr>
						{#each openSale.sales as order (order.sales_order_id)}
							<tr>
								<td class="!pl-3" colspan={4}>
									<p class="font-bold text-muted-foreground">
										Sales Order #{order.sales_order_id}
										<span class="ml-3 font-normal">
											{order.date_ordered
												? new Date(order.date_ordered).toLocaleDateString('default', {
														day: 'numeric',
														month: 'long',
														year: 'numeric'
													})
												: ''}
										</span>
									</p>
								</td>
							</tr>
							{#each order.items as item (item.item_name)}
								<tr>
									<td class="!border-t-0 !border-b-0 !pl-6">{item.item_name}</td>
									<td class="!border-t-0 !border-b-0">{item.item_quantity}</td>
									<td class="!border-t-0 !border-b-0 text-right"
										>{formatCurrency(item.item_cost ?? 0)}</td
									>
									<td class="!border-t-0 !border-b-0 text-right"
										>{formatCurrency(item.item_total_price ?? 0)}</td
									>
								</tr>
							{/each}
							<tr>
								<td class="!border-r-0 !pl-3" colspan={3}>
									<p class="font-bold text-muted-foreground">SO #{order.sales_order_id} Total:</p>
								</td>
								<td class="!border-l-0 text-right font-bold text-muted-foreground"
									>{formatCurrency(order.total)}</td
								>
							</tr>
						{/each}
						<tr>
							<td colspan={3} class="!border-r-0">
								<p class="font-bold">{openSale.customer} Total:</p>
							</td>
							<td class="!border-l-0 text-right font-bold">{formatCurrency(openSale.total)}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
			<tfoot>
				<tr>
					<td colspan={3} class="!border-r-0">
						<p class="font-bold">Grand Total:</p>
					</td>
					<td class="!border-l-0 text-right font-bold">{formatCurrency(grandTotal)}</td>
				</tr>
			</tfoot>
		</table>
	{/if}
</PrintReportLayout>
