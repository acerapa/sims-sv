<script lang="ts">
	import PrintReportLayout from '$lib/components/common/PrintReportLayout.svelte';
	import type { PageProps } from './$types';
	import { formatCurrency } from '$lib/utils/common';
	import { formatDate } from '$lib/utils/printables';
	import { openAndPrint } from '$lib/utils/pdf';
	import { buildSalesByRepPdf } from './pdf';

	let { data }: PageProps = $props();

	let detailed = $derived(data.detailed);

	async function handlePrint() {
		openAndPrint(await buildSalesByRepPdf({ detailed }, data.filters));
	}
</script>

<svelte:head>
	<title>Print - Sales by Representative</title>
</svelte:head>

<PrintReportLayout reportTitle="Sales by Representative" dateRange={data.filters} onPrint={handlePrint}>
	{#if detailed.length === 0}
		<p style="text-align: center; color: #666; padding: 2rem 0;">
			No invoices found for the selected date range.
		</p>
	{:else}
		{#each detailed as rep, rIdx (rep.rep_name)}
			<h3 class="print-section-title" class:page-break={rIdx > 0}>
				{rep.rep_name}
			</h3>

			{#each rep.invoices as invoice (invoice.invoice_id)}
				<div class="print-po-header">
					<span class="po-ref">INV-{invoice.invoice_id}</span>
					<span>{formatDate(invoice.invoice_date.toLocaleString())}</span>
					{#if invoice.invoice_notes}<span>{invoice.invoice_notes}</span>{/if}
				</div>
				<table class="print-table">
					<thead>
						<tr>
							<th>Item Description</th>
							<th class="text-right">Qty</th>
							<th class="text-right">Sales Price</th>
							<th class="text-right">Amount</th>
							<th class="text-right">Balance</th>
						</tr>
					</thead>
					<tbody>
						{#each invoice.items as item (item.item_name)}
							<tr>
								<td>{item.item_name}</td>
								<td class="text-right">{item.item_quantity}</td>
								<td class="text-right">{formatCurrency(item.item_price)}</td>
								<td class="text-right">{formatCurrency(item.item_total)}</td>
								<td class="text-right">{formatCurrency(invoice.balance)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/each}

			<p class="print-vendor-subtotal">
				Subtotal: {formatCurrency(rep.subtotal)}
			</p>
		{/each}

		<p class="print-vendor-subtotal" style="font-size: 1.05rem;">
			TOTAL: {formatCurrency(detailed.reduce((acc, rep) => acc + Number(rep.subtotal), 0))}
		</p>
	{/if}
</PrintReportLayout>
