<script lang="ts">
	import { page } from '$app/state';
	import PrintReportLayout from '$lib/components/common/PrintReportLayout.svelte';
	import { formatCurrency } from '$lib/utils/common';

	const rma = $derived(page.data?.rma);
</script>

<PrintReportLayout reportTitle="Inter-Branch Receiving Report">
	<section class="flex flex-col gap-3">
		<div class="flex gap-5">
			<div class="flex-1 border-b border-muted-foreground py-1">
				<p class="text-xs font-bold text-muted-foreground">RMA REFERENCE NO.</p>
				<p>RMA-{rma?.id}</p>
			</div>
			<div class="flex-1 border-b border-muted-foreground py-1">
				<p class="text-xs font-bold text-muted-foreground">TRANSFER DATE</p>
				<p>
					{rma?.date_returned.toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</p>
			</div>
		</div>
		<div class="flex gap-5">
			<div class="w-[calc(50%_-_10px)] border-b border-muted-foreground py-1">
				<p class="text-xs font-bold text-muted-foreground">SUPPLIER</p>
				<p>{rma?.supplier_name}</p>
			</div>
		</div>
		<div class="flex gap-5">
			<div class="flex-1 py-1">
				<p class="text-xs font-bold text-muted-foreground">NOTES</p>
				<div class="min-h-12 rounded border border-muted-foreground p-2">
					{rma?.notes ? rma?.notes : '---'}
				</div>
			</div>
		</div>

		<p class="mt-4 font-bold">Items Received</p>
		<hr class="border-muted-foreground" />
		<table class="print-table">
			<thead>
				<tr>
					<th>Product</th>
					<th>Serial Number</th>
					<th class="text-right">Quantity</th>
					<th class="text-right">Cost</th>
					<th class="text-right">Total Cost</th>
				</tr>
			</thead>
			<tbody>
				{#if rma?.items?.length === 0}
					<tr>
						<td colspan="4" style="text-align: center; color: #666;">
							No items found for the selected Stock Transfer Request.
						</td>
					</tr>
				{:else}
					{#each rma.items as item (item.product_id)}
						<tr>
							<td>{item.purchase_description}</td>
							<td>{item.serial_number}</td>
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
