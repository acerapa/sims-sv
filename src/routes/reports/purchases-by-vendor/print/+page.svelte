<script lang="ts">
	import PrintReportLayout from '$lib/components/common/PrintReportLayout.svelte';
	import type { PageProps } from './$types';
	import type { VendorDetailRow } from '$lib/server/db/queries/reports';

	let { data }: PageProps = $props();

	let summary = $derived(data.summary);
	let detail = $derived(data.detail);
	let view = $derived(data.view);

	let grandTotals = $derived({
		po_count: summary.reduce((sum, row) => sum + row.po_count, 0),
		total_items: summary.reduce((sum, row) => sum + row.total_items, 0),
		total_amount: summary.reduce((sum, row) => sum + parseFloat(row.total_amount || '0'), 0)
	});

	interface GroupedVendor {
		supplier_id: number | null;
		supplier_name: string;
		pos: {
			po_id: number;
			po_reference: string;
			receive_date: string;
			po_total: string;
			items: {
				product_name: string;
				product_sku: string;
				quantity: number;
				cost: string;
				total_cost: string;
			}[];
		}[];
		subtotal: number;
	}

	function groupDetailByVendor(rows: VendorDetailRow[]): GroupedVendor[] {
		const vendors: GroupedVendor[] = [];

		for (const row of rows) {
			let vendor = vendors.find((v) => v.supplier_id === row.supplier_id);
			if (!vendor) {
				vendor = {
					supplier_id: row.supplier_id,
					supplier_name: row.supplier_name,
					pos: [],
					subtotal: 0
				};
				vendors.push(vendor);
			}

			let po = vendor.pos.find((p) => p.po_id === row.po_id);
			if (!po) {
				po = {
					po_id: row.po_id,
					po_reference: row.po_reference,
					receive_date: row.receive_date,
					po_total: row.po_total,
					items: []
				};
				vendor.pos.push(po);
			}

			po.items.push({
				product_name: row.product_name,
				product_sku: row.product_sku,
				quantity: row.quantity,
				cost: row.cost,
				total_cost: row.total_cost
			});
		}

		for (const vendor of vendors) {
			vendor.subtotal = vendor.pos.reduce(
				(sum, po) => sum + parseFloat(po.po_total || '0'),
				0
			);
		}

		return vendors;
	}

	let detailGrouped = $derived(groupDetailByVendor(detail));

	function formatCurrency(value: string | number) {
		const num = typeof value === 'string' ? parseFloat(value || '0') : value;
		return `₱${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('default', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Print - Purchases by Vendor</title>
</svelte:head>

<PrintReportLayout
	reportTitle={view === 'detail' ? 'Purchases by Vendor — Detail' : view === 'both' ? 'Purchases by Vendor' : 'Purchases by Vendor — Summary'}
	dateRange={data.filters}
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
						<span>{formatDate(po.receive_date)}</span>
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
							{#each po.items as item}
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
