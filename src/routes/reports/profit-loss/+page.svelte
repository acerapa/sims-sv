<script lang="ts">
	import PageTitle from '$lib/components/layout/PageTitle.svelte';
	import DatePicker from '$lib/components/common/DatePicker.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Printer } from '@lucide/svelte';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableFooter,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let fromDate = $state<Date | undefined>(
		data.filters.from ? new Date(data.filters.from) : undefined
	);
	let toDate = $state<Date | undefined>(
		data.filters.to ? new Date(data.filters.to) : undefined
	);

	let activeTab = $state('summary');

	let summary = $derived(data.summary);
	let monthly = $derived(data.monthly);
	let detail = $derived(data.detail);

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

	function applyFilter() {
		const params = new URLSearchParams(page.url.searchParams);

		if (fromDate) {
			params.set('from', fromDate.toISOString().split('T')[0]);
		} else {
			params.delete('from');
		}

		if (toDate) {
			params.set('to', toDate.toISOString().split('T')[0]);
		} else {
			params.delete('to');
		}

		goto(`?${params.toString()}`, { replaceState: true });
	}

	function clearFilter() {
		fromDate = undefined;
		toDate = undefined;
		goto('?', { replaceState: true });
	}

	function openPrint() {
		const params = new URLSearchParams();
		params.set('view', activeTab);
		if (fromDate) params.set('from', fromDate.toISOString().split('T')[0]);
		if (toDate) params.set('to', toDate.toISOString().split('T')[0]);
		window.open(`/reports/profit-loss/print?${params.toString()}`, '_blank');
	}

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
	<title>RamTech | Profit & Loss</title>
	<meta name="description" content="Profit & Loss Report" />
</svelte:head>

<section class="flex flex-col gap-6">
	<PageTitle
		title="Profit & Loss"
		subTitle="Revenue, cost of goods sold, and gross profit analysis."
	/>

	<Card>
		<CardContent class="flex items-end gap-4 pt-6">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">From</span>
				<DatePicker bind:value={fromDate} />
			</div>
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">To</span>
				<DatePicker bind:value={toDate} />
			</div>
			<Button onclick={applyFilter}>Apply Filter</Button>
			<Button variant="outline" onclick={clearFilter}>Clear</Button>
		</CardContent>
	</Card>

	<!-- Summary Cards -->
	<div class="grid grid-cols-4 gap-4">
		<Card>
			<CardContent class="pt-6">
				<p class="text-sm font-medium text-muted-foreground">Total Income</p>
				<p class="text-2xl font-bold">{formatCurrency(summary.total_income)}</p>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="pt-6">
				<p class="text-sm font-medium text-muted-foreground">Cost of Goods Sold</p>
				<p class="text-2xl font-bold">{formatCurrency(summary.total_cogs)}</p>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="pt-6">
				<p class="text-sm font-medium text-muted-foreground">Gross Profit</p>
				<p class="text-2xl font-bold text-green-600">{formatCurrency(summary.gross_profit)}</p>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="pt-6">
				<p class="text-sm font-medium text-muted-foreground">Gross Margin</p>
				<p class="text-2xl font-bold">
					{grossMarginPercent(parseFloat(summary.total_income || '0'), parseFloat(summary.gross_profit || '0'))}%
				</p>
			</CardContent>
		</Card>
	</div>

	<Tabs bind:value={activeTab}>
		<div class="flex items-center justify-between">
			<TabsList>
				<TabsTrigger value="summary">Summary</TabsTrigger>
				<TabsTrigger value="detail">By Product</TabsTrigger>
			</TabsList>
			<Button variant="outline" onclick={openPrint}>
				<Printer size={16} />
				Print
			</Button>
		</div>

		<TabsContent value="summary">
			<Card>
				<CardHeader>
					<CardTitle>Profit & Loss Statement</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead></TableHead>
								{#each monthly as row (row.month)}
									<TableHead class="text-right">{formatMonth(row.month)}</TableHead>
								{/each}
								{#if monthly.length > 1}
									<TableHead class="text-right">Total</TableHead>
								{/if}
							</TableRow>
						</TableHeader>
						<TableBody>
							{#if monthly.length === 0}
								<TableRow>
									<TableCell colspan={2} class="text-center text-muted-foreground">
										No invoice data found for the selected date range.
									</TableCell>
								</TableRow>
							{:else}
								<TableRow>
									<TableCell class="font-semibold">Income</TableCell>
									{#each monthly as row (row.month)}
										<TableCell class="text-right">{formatCurrency(row.income)}</TableCell>
									{/each}
									{#if monthly.length > 1}
										<TableCell class="text-right font-semibold">{formatCurrency(monthlyTotals.income)}</TableCell>
									{/if}
								</TableRow>
								<TableRow>
									<TableCell class="font-semibold">Cost of Goods Sold</TableCell>
									{#each monthly as row (row.month)}
										<TableCell class="text-right">{formatCurrency(row.cogs)}</TableCell>
									{/each}
									{#if monthly.length > 1}
										<TableCell class="text-right font-semibold">{formatCurrency(monthlyTotals.cogs)}</TableCell>
									{/if}
								</TableRow>
							{/if}
						</TableBody>
						{#if monthly.length > 0}
							<TableFooter>
								<TableRow class="font-bold">
									<TableCell>Gross Profit</TableCell>
									{#each monthly as row (row.month)}
										<TableCell class="text-right">{formatCurrency(row.gross_profit)}</TableCell>
									{/each}
									{#if monthly.length > 1}
										<TableCell class="text-right">{formatCurrency(monthlyTotals.gross_profit)}</TableCell>
									{/if}
								</TableRow>
								<TableRow>
									<TableCell class="text-sm text-muted-foreground">Gross Margin %</TableCell>
									{#each monthly as row (row.month)}
										<TableCell class="text-right text-sm text-muted-foreground">
											{grossMarginPercent(parseFloat(row.income || '0'), parseFloat(row.gross_profit || '0'))}%
										</TableCell>
									{/each}
									{#if monthly.length > 1}
										<TableCell class="text-right text-sm text-muted-foreground">
											{grossMarginPercent(monthlyTotals.income, monthlyTotals.gross_profit)}%
										</TableCell>
									{/if}
								</TableRow>
							</TableFooter>
						{/if}
					</Table>
				</CardContent>
			</Card>
		</TabsContent>

		<TabsContent value="detail">
			<Card>
				<CardHeader>
					<CardTitle>Profit & Loss by Product</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>SKU</TableHead>
								<TableHead>Product</TableHead>
								<TableHead class="text-right">Qty Sold</TableHead>
								<TableHead class="text-right">Revenue</TableHead>
								<TableHead class="text-right">Cost</TableHead>
								<TableHead class="text-right">Profit</TableHead>
								<TableHead class="text-right">Margin %</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#if detail.length === 0}
								<TableRow>
									<TableCell colspan={7} class="text-center text-muted-foreground">
										No invoice data found for the selected date range.
									</TableCell>
								</TableRow>
							{:else}
								{#each detail as row (row.product_id)}
									<TableRow>
										<TableCell class="font-mono text-sm">{row.product_sku}</TableCell>
										<TableCell>{row.product_name}</TableCell>
										<TableCell class="text-right">{row.quantity_sold}</TableCell>
										<TableCell class="text-right">{formatCurrency(row.total_revenue)}</TableCell>
										<TableCell class="text-right">{formatCurrency(row.total_cost)}</TableCell>
										<TableCell class="text-right">{formatCurrency(row.profit)}</TableCell>
										<TableCell class="text-right">
											{grossMarginPercent(parseFloat(row.total_revenue || '0'), parseFloat(row.profit || '0'))}%
										</TableCell>
									</TableRow>
								{/each}
							{/if}
						</TableBody>
						{#if detail.length > 0}
							<TableFooter>
								<TableRow class="font-bold">
									<TableCell colspan={2}>Total</TableCell>
									<TableCell class="text-right">{detailTotals.quantity_sold}</TableCell>
									<TableCell class="text-right">{formatCurrency(detailTotals.total_revenue)}</TableCell>
									<TableCell class="text-right">{formatCurrency(detailTotals.total_cost)}</TableCell>
									<TableCell class="text-right">{formatCurrency(detailTotals.profit)}</TableCell>
									<TableCell class="text-right">
										{grossMarginPercent(detailTotals.total_revenue, detailTotals.profit)}%
									</TableCell>
								</TableRow>
							</TableFooter>
						{/if}
					</Table>
				</CardContent>
			</Card>
		</TabsContent>
	</Tabs>
</section>
