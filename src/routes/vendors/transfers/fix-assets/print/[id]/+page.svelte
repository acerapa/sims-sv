<script lang="ts">
	import { page } from '$app/state';
	import PrintReportLayout from '$lib/components/common/PrintReportLayout.svelte';
	import { capitalizeFirstLetter, formatCurrency } from '$lib/utils/common';
	import { openAndPrint } from '$lib/utils/pdf';
	import { buildFixAssetPdf, expandFixAssetItems } from './pdf';

	const fixAsset = $derived(page.data?.fixAsset);

	const items = $derived(expandFixAssetItems(fixAsset?.items ?? []));

	function handlePrint() {
		if (!fixAsset) return;
		openAndPrint(buildFixAssetPdf(fixAsset));
	}
</script>

<PrintReportLayout reportTitle="Fixed Asset Transfer" onPrint={handlePrint}>
	<section class="flex flex-col gap-3">
		<div class="flex gap-5">
			<div class="flex-1 border-b border-muted-foreground py-1">
				<p class="text-xs font-bold text-muted-foreground">FIX REFERENCE NO.</p>
				<p>FIX-{fixAsset?.id}</p>
			</div>
			<div class="flex-1 border-b border-muted-foreground py-1">
				<p class="text-xs font-bold text-muted-foreground">TRANSFER DATE</p>
				<p>
					{fixAsset?.date_transfered.toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</p>
			</div>
		</div>
		<div class="flex gap-5">
			<div class="w-[calc(50%_-_10px)] border-b border-muted-foreground py-1">
				<p class="text-xs font-bold text-muted-foreground">USER</p>
				<p>{fixAsset?.user ? capitalizeFirstLetter(fixAsset.user) : ''}</p>
			</div>
		</div>
		<div class="flex gap-5">
			<div class="flex-1 py-1">
				<p class="text-xs font-bold text-muted-foreground">NOTES</p>
				<div class="min-h-12 rounded border border-muted-foreground p-2">
					{fixAsset?.notes ? fixAsset?.notes : '---'}
				</div>
			</div>
		</div>

		<p class="mt-4 font-bold">Items Transferred</p>
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
						<td colspan="5" style="text-align: center; color: #666;">
							No items found for this Fix Asset.
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
