<script lang="ts">
	import { page } from '$app/state';
	import PrintReportLayout from '$lib/components/common/PrintReportLayout.svelte';
	import { capitalizeFirstLetter } from '$lib/utils/common';
	import { openAndPrint, formatDatePdf } from '$lib/utils/pdf';
	import { buildPhysicalInventoryPdf, type PhysicalInventoryPrintData } from './pdf';

	const sheet = $derived(
		(page.data as { sheet?: PhysicalInventoryPrintData } | undefined)?.sheet ?? null
	);

	const toNum = (v: string | number) => {
		const p = parseFloat(String(v ?? '0')) || 0;
		return Number.isFinite(p) ? p : 0;
	};

	const totals = $derived(
		(sheet?.items ?? []).reduce(
			(acc, i) => {
				acc.system += toNum(i.system_count);
				acc.actual += toNum(i.actual_count);
				acc.difference += toNum(i.difference);
				return acc;
			},
			{ system: 0, actual: 0, difference: 0 }
		)
	);

	const isDraft = $derived((sheet?.status || '').toLowerCase() === 'draft');

	const signed = (v: string | number) => {
		const n = toNum(v);
		return n > 0 ? `+${n}` : String(n);
	};

	const diffClass = (value: number) =>
		value === 0 ? 'text-gray-500' : value > 0 ? 'text-green-500' : 'text-red-500';

	const reportTitle = $derived(
		sheet
			? `Physical Inventory Sheet — PC-00${sheet.id} · ${capitalizeFirstLetter(sheet.status)}`
			: 'Physical Inventory Sheet'
	);

	async function handlePrint() {
		if (!sheet) return;
		openAndPrint(await buildPhysicalInventoryPdf(sheet));
	}
</script>

<PrintReportLayout {reportTitle} onPrint={handlePrint}>
	{#if sheet}
		<section class="flex flex-col gap-4">
			<h2 class="text-lg font-bold">{sheet.title}</h2>

			<div class="flex gap-5">
				<div class="flex-1 border-b border-muted-foreground py-1">
					<p class="text-xs font-bold text-muted-foreground">PREPARED BY</p>
					<p>{sheet.created_by || '—'}</p>
				</div>
				<div class="flex-1 border-b border-muted-foreground py-1">
					<p class="text-xs font-bold text-muted-foreground">DATE FINALIZED</p>
					<p>
						{sheet.date_finalized ? formatDatePdf(sheet.date_finalized) : '—'}
					</p>
				</div>
			</div>

			{#if sheet.notes}
				<div class="py-1">
					<p class="text-xs font-bold text-muted-foreground">NOTES</p>
					<div class="min-h-12 rounded border border-muted-foreground p-2">{sheet.notes}</div>
				</div>
			{/if}

			<table class="print-table">
				<thead>
					<tr>
						<th>Item</th>
						<th>SKU</th>
						<th>Category</th>
						<th class="text-right">System Count</th>
						<th class="text-right">Actual Count</th>
						{#if !isDraft}
							<th class="text-right">Difference</th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#if sheet.items.length === 0}
						<tr>
							<td colspan="6" style="text-align: center; color: #666;">
								No items on this inventory sheet.
							</td>
						</tr>
					{:else}
						{#each sheet.items as item (item.sku + item.purchase_description)}
							<tr>
								<td>{item.purchase_description}</td>
								<td>{item.sku}</td>
								<td>{item.category || ''}</td>
								<td class="text-right">{item.system_count}</td>
								<td class="text-right">{isDraft ? '' : item.actual_count}</td>
								{#if !isDraft}
									<td
										class={['text-right', isDraft ? '' : diffClass(toNum(item.difference))].join(
											' '
										)}
									>
										{isDraft ? '' : signed(item.difference)}
									</td>
								{/if}
							</tr>
						{/each}
					{/if}
				</tbody>
				{#if sheet.items.length > 0}
					<tfoot>
						<tr class="font-semibold">
							<td colspan="3">Total ({sheet.items.length} items)</td>
							<td class="text-right">{totals.system}</td>
							<td class="text-right">{isDraft ? '' : totals.actual}</td>
							{#if !isDraft}
								<td class={['text-right', isDraft ? '' : diffClass(totals.difference)].join(' ')}>
									{isDraft ? '' : signed(totals.difference)}
								</td>
							{/if}
						</tr>
					</tfoot>
				{/if}
			</table>
		</section>
	{:else}
		<p class="text-center text-muted-foreground">Physical inventory not found.</p>
	{/if}
</PrintReportLayout>
