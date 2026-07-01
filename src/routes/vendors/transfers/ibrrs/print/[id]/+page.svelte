<script lang="ts">
	import { page } from '$app/state';
	import PrintReportLayout from '$lib/components/common/PrintReportLayout.svelte';
	import { formatCurrency } from '$lib/utils/common';

	const ibrr = $derived(page.data?.ibrr);
</script>

<PrintReportLayout reportTitle="Inter-Branch Receiving Report">
	<section class="flex flex-col gap-3">
		<div class="flex gap-5">
			<div class="flex-1 border-b border-muted-foreground py-1">
				<p class="text-xs font-bold text-muted-foreground">IBRR REFERENCE NO.</p>
				<p>IBRR-{ibrr?.id}</p>
			</div>
			<div class="flex-1 border-b border-muted-foreground py-1">
				<p class="text-xs font-bold text-muted-foreground">STR REFERENCE NO.</p>
				<p>STR-{ibrr?.str_id}</p>
			</div>
		</div>
		<div class="flex gap-5">
			<div class="w-[calc(50%_-_10px)] border-b border-muted-foreground py-1">
				<p class="text-xs font-bold text-muted-foreground">SOURCE STORE</p>
				<p>{ibrr?.source_store_name}</p>
			</div>
		</div>
		<div class="flex gap-5">
			<div class="flex-1 py-1">
				<p class="text-xs font-bold text-muted-foreground">NOTES</p>
				<div class="min-h-12 rounded border border-muted-foreground p-2">
					{ibrr?.notes ? ibrr?.notes : '---'}
				</div>
			</div>
		</div>

		<p class="mt-4 font-bold">Items Received</p>
		<hr class="border-muted-foreground" />
		<table class="print-table">
			<thead>
				<tr>
					<th>Product</th>
					<th class="text-right">Quantity</th>
					<th class="text-right">Cost</th>
					<th class="text-right">Total Cost</th>
				</tr>
			</thead>
			<tbody>
				{#if ibrr?.items?.length === 0}
					<tr>
						<td colspan="4" style="text-align: center; color: #666;">
							No items found for the selected Stock Transfer Request.
						</td>
					</tr>
				{:else}
					{#each ibrr.items as item (item.product_id)}
						<tr>
							<td>{item.purchase_description}</td>
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
