<script lang="ts">
	import PrintReportLayout from '$lib/components/common/PrintReportLayout.svelte';
	import { openAndPrint, formatDatePdf } from '$lib/utils/pdf';
	import { formatCurrency } from '$lib/utils/common';
	import { groupByProduct, buildInventoryValuationPdf, type InventoryValuationView } from '../pdf';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let summary = $derived(data.summary);
	let detail = $derived(data.detail);
	let view = $derived(data.view);

	let detailSections = $derived(groupByProduct(detail));

	let grandTotals = $derived({
		opening: summary.reduce((sum, row) => sum + row.opening, 0),
		qty_in: summary.reduce((sum, row) => sum + row.qty_in, 0),
		qty_out: summary.reduce((sum, row) => sum + row.qty_out, 0),
		ending: summary.reduce((sum, row) => sum + row.ending, 0),
		ending_value: summary.reduce((sum, row) => sum + parseFloat(row.ending_value || '0'), 0)
	});

	async function handlePrint() {
		openAndPrint(
			await buildInventoryValuationPdf(
				{ summary, detail },
				view as InventoryValuationView,
				data.filters
			)
		);
	}

	function signedQty(qty: number) {
		return qty > 0 ? `+${qty}` : String(qty);
	}
</script>

<svelte:head>
	<title>Print - Inventory Valuation Detail</title>
</svelte:head>

<PrintReportLayout
	reportTitle={view === 'summary' ? 'Inventory Valuation Summary' : 'Inventory Valuation Detail'}
	dateRange={data.filters}
	onPrint={handlePrint}
>
	<p class="text-xs text-muted-foreground" style="margin: 0 0 0.75rem;">
		RMAs and physical inventory counts do not affect stock in this system and are not included.
	</p>

	{#if view === 'summary'}
		<table class="print-table">
			<thead>
				<tr>
					<th>Item</th>
					<th>SKU</th>
					<th class="text-right">Opening</th>
					<th class="text-right">+ In</th>
					<th class="text-right">- Out</th>
					<th class="text-right">Ending Stock</th>
					<th class="text-right">Ending Value</th>
				</tr>
			</thead>
			<tbody>
				{#if summary.length === 0}
					<tr>
						<td colspan="7" style="text-align: center; color: #666;">
							No stock movements found for the selected date range.
						</td>
					</tr>
				{:else}
					{#each summary as row (row.product_id)}
						<tr>
							<td>{row.product_name}</td>
							<td>{row.product_sku}</td>
							<td class="text-right">{row.opening}</td>
							<td class="text-right">{row.qty_in}</td>
							<td class="text-right">{row.qty_out}</td>
							<td class="text-right">{row.ending}</td>
							<td class="text-right">{formatCurrency(row.ending_value)}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
			{#if summary.length > 0}
				<tfoot>
					<tr>
						<td class="font-bold">Grand Total</td>
						<td></td>
						<td class="text-right">{grandTotals.opening}</td>
						<td class="text-right">{grandTotals.qty_in}</td>
						<td class="text-right">{grandTotals.qty_out}</td>
						<td class="text-right">{grandTotals.ending}</td>
						<td class="text-right">{formatCurrency(grandTotals.ending_value)}</td>
					</tr>
				</tfoot>
			{/if}
		</table>
	{:else if detailSections.length === 0}
		<p style="text-align: center; color: #666; padding: 2rem 0;">
			No stock movements found for the selected date range.
		</p>
	{:else}
		{#each detailSections as section, sIdx (section.product_id)}
			<h3 class="print-section-title" class:page-break={sIdx > 0}>
				{section.product_sku} — {section.product_name}
				<span class="text-sm font-normal" style="color: #666;">
					({section.category_name}) — System stock: {section.system_stock}
				</span>
			</h3>
			<table class="print-table">
				<thead>
					<tr>
						<th>Date</th>
						<th>Type</th>
						<th>Ref No.</th>
						<th>Counterparty</th>
						<th class="text-right">Qty</th>
						<th class="text-right">Unit Cost</th>
						<th class="text-right">On Hand</th>
						<th class="text-right">Asset Value</th>
					</tr>
				</thead>
				<tbody>
					{#each section.lines as line, lineIdx (lineIdx)}
						<tr style={line.is_opening ? 'color: #666; font-style: italic;' : ''}>
							<td>{formatDatePdf(line.txn_date)}</td>
							<td>{line.transaction_type}</td>
							<td>{line.ref_no || '—'}</td>
							<td>{line.counterparty || '—'}</td>
							<td class="text-right">{signedQty(line.quantity)}</td>
							<td class="text-right">{formatCurrency(line.unit_cost)}</td>
							<td class="text-right">{line.on_hand_after}</td>
							<td class="text-right">{formatCurrency(line.asset_value_after)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if section.stock_mismatch}
				<p
					class="text-xs"
					style="color: #666; font-style: italic; text-align: right; margin-top: 0.25rem;"
				>
					Note: reconstructed ending balance does not match the current system stock ({section.system_stock})
					— likely a manual stock edit.
				</p>
			{/if}
		{/each}
	{/if}
</PrintReportLayout>
