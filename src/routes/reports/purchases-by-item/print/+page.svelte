<script lang="ts">
	import PrintReportLayout from '$lib/components/common/PrintReportLayout.svelte';
	import { openAndPrint, formatDatePdf } from '$lib/utils/pdf';
	import {
		groupDetailByCategory,
		buildPurchasesByItemPdf,
		type PurchasesByItemView
	} from '../pdf';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let summary = $derived(data.summary);
	let detail = $derived(data.detail);
	let view = $derived(data.view);

	let grandTotals = $derived({
		po_count: summary.reduce((sum, row) => sum + row.po_count, 0),
		total_items: summary.reduce((sum, row) => sum + row.total_items, 0),
		total_amount: summary.reduce((sum, row) => sum + parseFloat(row.total_amount || '0'), 0)
	});

	let detailGrouped = $derived(groupDetailByCategory(detail));

	async function handlePrint() {
		openAndPrint(
			await buildPurchasesByItemPdf(
				{ summary, detail },
				view as PurchasesByItemView,
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
	<title>Print - Purchases by Item</title>
</svelte:head>

<PrintReportLayout
	reportTitle={view === 'detail' ? 'Purchases by Item — Detail' : view === 'both' ? 'Purchases by Item' : 'Purchases by Item — Summary'}
	dateRange={data.filters}
	onPrint={handlePrint}
>
	{#if view === 'summary' || view === 'both'}
		<table class="print-table">
			<thead>
				<tr>
					<th>Category Name</th>
					<th class="text-right"># of POs</th>
					<th class="text-right">Total Items Purchased</th>
					<th class="text-right">Total Amount</th>
				</tr>
			</thead>
			<tbody>
				{#if summary.length === 0}
					<tr>
						<td colspan="4" style="text-align: center; color: #666;">
							No purchases found for the selected date range.
						</td>
					</tr>
				{:else}
					{#each summary as row (row.category_id)}
						<tr>
							<td>{row.category_name}</td>
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
				No purchases found for the selected date range.
			</p>
		{:else}
			{#each detailGrouped as section, sIdx (section.category_id)}
				<h3 class="print-section-title" class:page-break={sIdx > 0 && view === 'detail'}>
					{section.category_name}
				</h3>
				<table class="print-table">
					<thead>
						<tr>
							<th>Type</th>
							<th>Date</th>
							<th>Ref No.</th>
							<th>Memo</th>
							<th>Vendor</th>
							<th>Item</th>
							<th class="text-right">Qty</th>
							<th class="text-right">Cost Price</th>
							<th class="text-right">Amount</th>
							<th class="text-right">Balance</th>
						</tr>
					</thead>
					<tbody>
						{#each section.lines as line}
							<tr>
								<td>{line.transaction_type}</td>
								<td>{formatDatePdf(line.receive_date)}</td>
								<td>{line.po_reference}</td>
								<td>{line.memo}</td>
								<td>{line.supplier_name}</td>
								<td>{line.product_name}</td>
								<td class="text-right">{line.quantity}</td>
								<td class="text-right">{formatCurrency(line.cost)}</td>
								<td class="text-right">{formatCurrency(line.total_cost)}</td>
								<td class="text-right">{formatCurrency(line.running_balance)}</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr>
							<td colspan="8" class="text-right">Subtotal:</td>
							<td class="text-right" colspan="2">{formatCurrency(section.subtotal)}</td>
						</tr>
					</tfoot>
				</table>
			{/each}
		{/if}
	{/if}
</PrintReportLayout>
