<script lang="ts">
	import PrintReportLayout from '$lib/components/common/PrintReportLayout.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let summary = $derived(data.summary);
	let monthly = $derived(data.monthly);
	let detail = $derived(data.detail);
	let view = $derived(data.view);

	let monthlyTotals = $derived({
		income: monthly.reduce((sum, row) => sum + parseFloat(row.income || '0'), 0),
		cogs: monthly.reduce((sum, row) => sum + parseFloat(row.cogs || '0'), 0),
		gross_profit: monthly.reduce((sum, row) => sum + parseFloat(row.gross_profit || '0'), 0)
	});

	let detailTotals = $derived({
		quantity_sold: detail.reduce((sum, row) => sum + row.quantity_sold, 0),
		total_revenue: detail.reduce((sum, row) => sum + parseFloat(row.total_revenue || '0'), 0),
		total_cost: detail.reduce((sum, row) => sum + parseFloat(row.total_cost || '0'), 0),
		profit: detail.reduce((sum, row) => sum + parseFloat(row.profit || '0'), 0)
	});

	function formatCurrency(value: string | number) {
		const num = typeof value === 'string' ? parseFloat(value || '0') : value;
		return `₱${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	function formatMonth(monthStr: string) {
		const [year, month] = monthStr.split('-');
		const date = new Date(parseInt(year), parseInt(month) - 1);
		return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
	}

	function grossMarginPercent(income: number, grossProfit: number) {
		if (income === 0) return '0.0';
		return ((grossProfit / income) * 100).toFixed(1);
	}
</script>

<svelte:head>
	<title>Print - Profit & Loss</title>
</svelte:head>

<PrintReportLayout
	reportTitle={view === 'detail' ? 'Profit & Loss — By Product' : view === 'both' ? 'Profit & Loss' : 'Profit & Loss — Summary'}
	dateRange={data.filters}
>
	{#if view === 'summary' || view === 'both'}
		<!-- Overall Totals -->
		<div style="display: flex; gap: 2rem; margin-bottom: 1.5rem; font-size: 0.85rem;">
			<div>
				<strong>Total Income:</strong> {formatCurrency(summary.total_income)}
			</div>
			<div>
				<strong>COGS:</strong> {formatCurrency(summary.total_cogs)}
			</div>
			<div>
				<strong>Gross Profit:</strong> {formatCurrency(summary.gross_profit)}
			</div>
			<div>
				<strong>Gross Margin:</strong> {grossMarginPercent(parseFloat(summary.total_income || '0'), parseFloat(summary.gross_profit || '0'))}%
			</div>
		</div>

		<!-- Monthly Breakdown -->
		<table class="print-table">
			<thead>
				<tr>
					<th></th>
					{#each monthly as row (row.month)}
						<th class="text-right">{formatMonth(row.month)}</th>
					{/each}
					{#if monthly.length > 1}
						<th class="text-right">Total</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#if monthly.length === 0}
					<tr>
						<td colspan="2" style="text-align: center; color: #666;">
							No invoice data found for the selected date range.
						</td>
					</tr>
				{:else}
					<tr>
						<td class="font-bold">Income</td>
						{#each monthly as row (row.month)}
							<td class="text-right">{formatCurrency(row.income)}</td>
						{/each}
						{#if monthly.length > 1}
							<td class="text-right font-bold">{formatCurrency(monthlyTotals.income)}</td>
						{/if}
					</tr>
					<tr>
						<td class="font-bold">Cost of Goods Sold</td>
						{#each monthly as row (row.month)}
							<td class="text-right">{formatCurrency(row.cogs)}</td>
						{/each}
						{#if monthly.length > 1}
							<td class="text-right font-bold">{formatCurrency(monthlyTotals.cogs)}</td>
						{/if}
					</tr>
				{/if}
			</tbody>
			{#if monthly.length > 0}
				<tfoot>
					<tr>
						<td>Gross Profit</td>
						{#each monthly as row (row.month)}
							<td class="text-right">{formatCurrency(row.gross_profit)}</td>
						{/each}
						{#if monthly.length > 1}
							<td class="text-right">{formatCurrency(monthlyTotals.gross_profit)}</td>
						{/if}
					</tr>
					<tr>
						<td style="font-weight: normal; font-size: 0.75rem; color: #666;">Gross Margin %</td>
						{#each monthly as row (row.month)}
							<td class="text-right" style="font-weight: normal; font-size: 0.75rem; color: #666;">
								{grossMarginPercent(parseFloat(row.income || '0'), parseFloat(row.gross_profit || '0'))}%
							</td>
						{/each}
						{#if monthly.length > 1}
							<td class="text-right" style="font-weight: normal; font-size: 0.75rem; color: #666;">
								{grossMarginPercent(monthlyTotals.income, monthlyTotals.gross_profit)}%
							</td>
						{/if}
					</tr>
				</tfoot>
			{/if}
		</table>
	{/if}

	{#if view === 'both'}
		<div class="page-break"></div>
		<h3 class="print-section-title" style="margin-top: 0;">By Product</h3>
	{/if}

	{#if view === 'detail' || view === 'both'}
		<table class="print-table">
			<thead>
				<tr>
					<th>SKU</th>
					<th>Product</th>
					<th class="text-right">Qty Sold</th>
					<th class="text-right">Revenue</th>
					<th class="text-right">Cost</th>
					<th class="text-right">Profit</th>
					<th class="text-right">Margin %</th>
				</tr>
			</thead>
			<tbody>
				{#if detail.length === 0}
					<tr>
						<td colspan="7" style="text-align: center; color: #666;">
							No invoice data found for the selected date range.
						</td>
					</tr>
				{:else}
					{#each detail as row (row.product_id)}
						<tr>
							<td style="font-family: monospace; font-size: 0.75rem;">{row.product_sku}</td>
							<td>{row.product_name}</td>
							<td class="text-right">{row.quantity_sold}</td>
							<td class="text-right">{formatCurrency(row.total_revenue)}</td>
							<td class="text-right">{formatCurrency(row.total_cost)}</td>
							<td class="text-right">{formatCurrency(row.profit)}</td>
							<td class="text-right">
								{grossMarginPercent(parseFloat(row.total_revenue || '0'), parseFloat(row.profit || '0'))}%
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
			{#if detail.length > 0}
				<tfoot>
					<tr>
						<td colspan="2">Total</td>
						<td class="text-right">{detailTotals.quantity_sold}</td>
						<td class="text-right">{formatCurrency(detailTotals.total_revenue)}</td>
						<td class="text-right">{formatCurrency(detailTotals.total_cost)}</td>
						<td class="text-right">{formatCurrency(detailTotals.profit)}</td>
						<td class="text-right">
							{grossMarginPercent(detailTotals.total_revenue, detailTotals.profit)}%
						</td>
					</tr>
				</tfoot>
			{/if}
		</table>
	{/if}
</PrintReportLayout>
