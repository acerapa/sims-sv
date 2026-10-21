<script lang="ts">
	import PrintReportLayout from '$lib/components/common/PrintReportLayout.svelte';
	import type { PageProps } from './$types';
	import { formatCurrency } from '$lib/utils/common';
	import { openAndPrint } from '$lib/utils/pdf';
	import { buildInventoryPdf } from './pdf';

	let { data }: PageProps = $props();

	let products = $derived(data.products);
	let totalQuantity = $derived(products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0));
</script>

<svelte:head>
	<title>Print - Inventory</title>
</svelte:head>

<PrintReportLayout
	reportTitle="Inventory List"
	onPrint={() => openAndPrint(buildInventoryPdf(products, data.total))}
>
	<table class="print-table">
		<thead>
			<tr>
				<th>Item Description</th>
				<th>SKU</th>
				<th>Category</th>
				<th class="text-right">Quantity</th>
				<th class="text-right">Price</th>
			</tr>
		</thead>
		<tbody>
			{#if products.length === 0}
				<tr>
					<td colspan="5" style="text-align: center; color: #666;">
						No products found.
					</td>
				</tr>
			{:else}
				{#each products as prod (prod.id)}
					<tr>
						<td>{prod.purchase_description}</td>
						<td>{prod.sku}</td>
						<td>{prod.category.name}</td>
						<td class="text-right">{prod.quantity || 0}</td>
						<td class="text-right">{formatCurrency(prod.sale_price || 0)}</td>
					</tr>
				{/each}
			{/if}
		</tbody>
		{#if products.length > 0}
			<tfoot>
				<tr>
					<td>Total ({data.total} items)</td>
					<td></td>
					<td></td>
					<td class="text-right">{totalQuantity}</td>
					<td></td>
				</tr>
			</tfoot>
		{/if}
	</table>
</PrintReportLayout>
