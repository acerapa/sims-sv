<script lang="ts">
	import PrintReportLayout from '#lib/components/common/PrintReportLayout.svelte';
	import type { PageProps } from './$types';
	import { formatCurrency } from '#lib/utils/common.ts';
	import { formatDate } from '#lib/utils/printables.ts';
	import { openAndPrint } from '#lib/utils/pdf.ts';
	import { buildVendorLedgers, grandTotalBalance } from '#lib/utils/vendor-balance.ts';
	import { buildVendorBalancePdf } from './pdf';

	let { data }: PageProps = $props();

	let ledgers = $derived(buildVendorLedgers(data.rows));

	async function handlePrint() {
		openAndPrint(
			await buildVendorBalancePdf({ ledgers: buildVendorLedgers(data.rows) }, data.filters)
		);
	}
</script>

<svelte:head>
	<title>Print - Vendor Balance Detail</title>
</svelte:head>

<PrintReportLayout
	reportTitle="Vendor Balance Detail"
	dateRange={data.filters}
	onPrint={handlePrint}
>
	{#if ledgers.length === 0}
		<p style="text-align: center; color: #666; padding: 2rem 0;">
			No bills found for the selected range.
		</p>
	{:else}
		{#each ledgers as vendor (vendor.supplier_id ?? vendor.supplier_name)}
			<h3 class="print-section-title">{vendor.supplier_name}</h3>
			<table class="print-table vbd-table">
				<thead>
					<tr>
						<th>Type</th>
						<th>Date</th>
						<th>Num</th>
						<th>Memo</th>
						<th class="text-right">Amount</th>
						<th class="text-right">Balance</th>
					</tr>
				</thead>
				<tbody>
					{#if vendor.opening_balance !== 0}
						<tr>
							<td>Opening Balance</td>
							<td></td>
							<td></td>
							<td></td>
							<td class="text-right"></td>
							<td class="text-right">{formatCurrency(vendor.opening_balance)}</td>
						</tr>
					{/if}
					{#each vendor.rows as row (row.bill_id)}
						<tr>
							<td>{row.type}</td>
							<td>{formatDate(new Date(row.date).toLocaleString())}</td>
							<td>{row.num}</td>
							<td>{row.memo}</td>
							<td class="text-right">{formatCurrency(row.amount)}</td>
							<td class="text-right">{formatCurrency(row.balance)}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr>
						<td colspan="4">Total {vendor.supplier_name}</td>
						<td class="text-right">{formatCurrency(vendor.total_amount)}</td>
						<td class="text-right">{formatCurrency(vendor.ending_balance)}</td>
					</tr>
				</tfoot>
			</table>
		{/each}

		<p class="print-vendor-subtotal" style="font-size: 1.05rem;">
			TOTAL ALL VENDORS: {formatCurrency(grandTotalBalance(ledgers))}
		</p>
	{/if}
</PrintReportLayout>

<style>
	/* Accounting style per the client spec: white cells, no grid, rules only
	   under the header and around each vendor's total row. */
	:global(.vbd-table th),
	:global(.vbd-table td) {
		border: none;
		border-bottom: none;
		background: #fff;
	}

	:global(.vbd-table thead th) {
		border-bottom: 1px solid #000;
		background: #fff;
	}

	:global(.vbd-table tfoot td) {
		border-top: 1px solid #000;
		border-bottom: 1px solid #000;
		background: #fff;
	}
</style>
