<script lang="ts">
	import PrintReportLayout from '$lib/components/common/PrintReportLayout.svelte';
	import { formatCurrency } from '$lib/utils/common';
	import { formatDate } from '$lib/utils/printables';
	import { openAndPrint } from '$lib/utils/pdf';
	import { buildPackageDetailsPdf } from './pdf';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let pkg = $derived(data.pkg);
	let items = $derived(pkg.packagesToProducts);

	async function handlePrint() {
		openAndPrint(
			await buildPackageDetailsPdf({
				id: pkg.id,
				name: pkg.name,
				description: pkg.description,
				total_price: pkg.total_price,
				created_at: pkg.created_at,
				items: items.map((row) => ({
					...row,
					price: row.price ?? '0',
					total_price: row.total_price ?? '0'
				}))
			})
		);
	}
</script>

<svelte:head>
	<title>Print Package {pkg.name}</title>
</svelte:head>

<PrintReportLayout reportTitle={`Package — ${pkg.name}`} onPrint={handlePrint}>
	<div class="package-info">
		{#if pkg.description}
			<p>Description: {pkg.description}</p>
		{/if}
		<p>Created: {formatDate(pkg.created_at.toLocaleString())}</p>
		<p>Items: {items.length}</p>
	</div>

	<table class="print-table">
		<thead>
			<tr>
				<th>#</th>
				<th>Description</th>
				<th>SKU</th>
				<th class="text-right">Qty</th>
				<th class="text-right">Rate</th>
				<th>S/N</th>
				<th class="text-right">Amount</th>
			</tr>
		</thead>
		<tbody>
			{#if items.length === 0}
				<tr>
					<td colspan="7" style="text-align: center; color: #666;">No items in this package.</td>
				</tr>
			{:else}
				{#each items as item, i (item.product_id)}
					<tr>
						<td>{i + 1}</td>
						<td>{item.product?.sales_description || '—'}</td>
						<td>{item.product?.sku || ''}</td>
						<td class="text-right">{item.quantity}</td>
						<td class="text-right">{formatCurrency(item.price ?? '0')}</td>
						<td>{item.serial_number || ''}</td>
						<td class="text-right">{formatCurrency(item.total_price ?? '0')}</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>

	<p class="package-total">Total: {formatCurrency(pkg.total_price ?? '0')}</p>
</PrintReportLayout>

<style>
	.package-info {
		font-size: 0.85rem;
		color: #333;
		margin-bottom: 1rem;
	}

	.package-info p {
		margin: 0 0 0.25rem;
	}

	.package-total {
		text-align: right;
		font-weight: 700;
		margin-top: 0.75rem;
	}
</style>
