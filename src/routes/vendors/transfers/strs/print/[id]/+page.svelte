<script lang="ts">
	import { page } from '$app/state';
	import PrintReportLayout from '$lib/components/common/PrintReportLayout.svelte';
	import { formatCurrency } from '$lib/utils/common';
	import { openAndPrint } from '$lib/utils/pdf';
	import { buildStrPdf, expandStrItems } from './pdf';

	const str = $derived(page.data?.str);

	const items = $derived(expandStrItems(str?.items ?? []));

	async function handlePrint() {
		if (!str) return;
		openAndPrint(await buildStrPdf(str));
	}
</script>

<PrintReportLayout reportTitle="Stock Transfer Report" onPrint={handlePrint}>
	<section class="flex flex-col gap-3">
		<div class="flex gap-5">
			<div class="flex-1 border-b border-muted-foreground py-1">
				<p class="text-xs font-bold text-muted-foreground">STR REFERENCE NO.</p>
				<p>STR-{str?.id}</p>
			</div>
			<div class="flex-1 border-b border-muted-foreground py-1">
				<p class="text-xs font-bold text-muted-foreground">TRANSFER DATE</p>
				<p>
					{str?.transfer_date.toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</p>
			</div>
		</div>
		<div class="flex gap-5">
			<div class="w-[calc(50%_-_10px)] border-b border-muted-foreground py-1">
				<p class="text-xs font-bold text-muted-foreground">DESTINATION</p>
				<p>{str?.store_name}</p>
			</div>
		</div>
		<div class="flex gap-5">
			<div class="flex-1 py-1">
				<p class="text-xs font-bold text-muted-foreground">NOTES</p>
				<div class="min-h-12 rounded border border-muted-foreground p-2">
					{str?.notes ? str?.notes : '---'}
				</div>
			</div>
		</div>

		<p class="mt-4 font-bold">Items Received</p>
		<hr class="border-muted-foreground" />
		<table class="print-table">
			<thead>
				<tr>
					<th>Product</th>
					<th>SN</th>
					<th class="text-right">Quantity</th>
					<th class="text-right">Cost</th>
					<th class="text-right">Total Cost</th>
				</tr>
			</thead>
			<tbody>
				{#if items.length === 0}
					<tr>
						<td colspan="4" style="text-align: center; color: #666;">
							No items found for the selected Stock Transfer Request.
						</td>
					</tr>
				{:else}
					{#each items as item (item)}
						<tr>
							<td>{item.item_description}</td>
							<td>{item.serial_number || '--'}</td>
							<td class="text-right">{item.quantity}</td>
							<td class="text-right">{formatCurrency(item.cost)}</td>
							<td class="text-right">{formatCurrency(item.total_cost)}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</section>
</PrintReportLayout>
