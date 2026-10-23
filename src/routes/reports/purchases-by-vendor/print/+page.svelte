<script lang="ts">
	import PrintReportLayout from '$lib/components/common/PrintReportLayout.svelte';
	import type { PageProps } from './$types';
	import { openAndPrint, formatDatePdf } from '$lib/utils/pdf';
	import { groupDetailByVendor, buildPurchasesByVendorPdf, type PurchasesByVendorView } from './pdf';

	let { data }: PageProps = $props();

	let summary = $derived(data.summary);
	let detail = $derived(data.detail);
	let view = $derived(data.view);

	let grandTotals = $derived({
		po_count: summary.reduce((sum, row) => sum + row.po_count, 0),
		total_items: summary.reduce((sum, row) => sum + row.total_items, 0),
		total_amount: summary.reduce((sum, row) => sum + parseFloat(row.total_amount || '0'), 0)
	});

	let detailGrouped = $derived(groupDetailByVendor(detail));

	function handlePrint() {
		openAndPrint(
			buildPurchasesByVendorPdf(
				{ summary, detail },
				view as PurchasesByVendorView,
				data.filters
			)
		);
	}

	function formatCurrency(value: string | number) {
		const num = typeof value === 'string' ? parseFloat(value || '0') : value;
		return `₱${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}
</script>

<svelte:head>
	<title>Print - Purchases by Vendor</title>
</svelte:head>

<PrintReportLayout
	reportTitle={view === 'detail' ? 'Purchases by Vendor — Detail' : view === 'both' ? 'Purchases by Vendor' : 'Purchases by Vendor — Summary'}
	dateRange={data.filters}
	onPrint={handlePrint}
>
	{#if view === 'summary' || view === 'both'}
		<table class="print-table">
			<thead>
				<tr>
					<th>Vendor Name</th>
					<th class="text-right"># of POs</th>
					<th class="text-right">Total Items Received</th>
					<th class="text-right">Total Amount</th>
				</tr>
			</thead>
			<tbody>
				{#if summary.length === 0}
					<tr>
						<td colspan="4" style="text-align: center; color: #666;">
							No purchase orders found for the selected date range.
						</td>
					</tr>
				{:else}
					{#each summary as row (row.supplier_id)}
						<tr>
							<td>{row.supplier_name}</td>
							<td class="text-right">{row.po_count}</td>
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
						<td class="text-right">{grandTotals.po_count}</td>
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
				No purchase orders found for the selected date range.
			</p>
		{:else}
			{#each detailGrouped as vendor, vIdx (vendor.supplier_id)}
				<h3 class="print-section-title" class:page-break={vIdx > 0 && view === 'detail'}>
					{vendor.supplier_name}
				</h3>

				{#each vendor.pos as po (po.po_id)}
					<div class="print-po-header">
						<span class="po-ref">{po.po_reference}</span>
						<span>{formatDatePdf(po.receive_date)}</span>
					</div>
					<table class="print-table">
						<thead>
							<tr>
								<th>Product</th>
								<th class="text-right">Qty</th>
								<th class="text-right">Unit Cost</th>
								<th class="text-right">Total Cost</th>
							</tr>
						</thead>
						<tbody>
							{#each po.items as item, itemIdx (itemIdx)}
								<tr>
									<td>{item.product_name}</td>
									<td class="text-right">{item.quantity}</td>
									<td class="text-right">{formatCurrency(item.cost)}</td>
									<td class="text-right">{formatCurrency(item.total_cost)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/each}

				<p class="print-vendor-subtotal">
					Subtotal: {formatCurrency(vendor.subtotal)}
				</p>
			{/each}
		{/if}
	{/if}
</PrintReportLayout>
