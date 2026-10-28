<script lang="ts">
	import PageTitle from '$lib/components/layout/PageTitle.svelte';
	import DatePicker from '$lib/components/common/DatePicker.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Printer } from '@lucide/svelte';
	import {
		Card,
		CardContent,
		CardDescription,
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
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { goto } from '$app/navigation';
	import { groupByProduct } from './pdf';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let fromDate = $state<Date | undefined>(
		data.filters.from ? new Date(data.filters.from) : undefined
	);
	let toDate = $state<Date | undefined>(data.filters.to ? new Date(data.filters.to) : undefined);
	let selectedProduct = $state(data.filters.product != null ? String(data.filters.product) : '0');

	let activeTab = $state<'detail' | 'summary'>(data.view === 'summary' ? 'summary' : 'detail');
	let summary = $derived(data.summary);
	let detail = $derived(data.detail);

	let detailSections = $derived(groupByProduct(detail));

	let grandTotals = $derived({
		opening: summary.reduce((sum, row) => sum + row.opening, 0),
		qty_in: summary.reduce((sum, row) => sum + row.qty_in, 0),
		qty_out: summary.reduce((sum, row) => sum + row.qty_out, 0),
		ending: summary.reduce((sum, row) => sum + row.ending, 0),
		ending_value: summary.reduce((sum, row) => sum + parseFloat(row.ending_value || '0'), 0)
	});

	function buildParams(view: string) {
		const params = new URLSearchParams();
		params.set('view', view);
		if (fromDate) params.set('from', fromDate.toISOString());
		if (toDate) params.set('to', toDate.toISOString());
		if (selectedProduct !== '0') params.set('product', selectedProduct);
		return params.toString();
	}

	function applyFilter() {
		goto(`?${buildParams(activeTab)}`, { replaceState: true });
	}

	function clearFilter() {
		fromDate = undefined;
		toDate = undefined;
		selectedProduct = '0';
		goto(`?view=${activeTab}`, { replaceState: true });
	}

	function openPrint() {
		window.open(`/reports/inventory-valuation/print?${buildParams(activeTab)}`, '_blank');
	}

	function formatCurrency(value: string | number) {
		const num = typeof value === 'string' ? parseFloat(value || '0') : value;
		return `₱${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	function formatDate(value: string | Date) {
		return new Date(value).toLocaleDateString('default', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function signedQty(qty: number) {
		return qty > 0 ? `+${qty}` : String(qty);
	}
</script>

<svelte:head>
	<title>RamTech | Inventory Valuation Detail</title>
	<meta name="description" content="Inventory Valuation Detail Report" />
</svelte:head>

<section class="flex flex-col gap-6">
	<PageTitle
		title="Inventory Valuation Detail"
		subTitle="Every stock movement per item, with the running on-hand quantity and asset value after each one."
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
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">Item</span>
				<Select type="single" name="product" bind:value={selectedProduct}>
					<SelectTrigger class="w-64">
						{selectedProduct === '0'
							? 'All Items'
							: data.productOptions.find((p) => String(p.id) === selectedProduct)?.sku}
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="0">All Items</SelectItem>
						{#each data.productOptions as product (product.id)}
							<SelectItem value={String(product.id)}>{product.sku}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
			</div>
			<Button onclick={applyFilter}>Apply Filter</Button>
			<Button variant="outline" onclick={clearFilter}>Clear</Button>
		</CardContent>
	</Card>

	<p class="text-xs text-muted-foreground">
		RMAs and physical inventory counts do not affect stock in this system and are not included.
	</p>

	<Tabs bind:value={activeTab}>
		<div class="flex items-center justify-between">
			<TabsList>
				<TabsTrigger value="detail">Detail</TabsTrigger>
				<TabsTrigger value="summary">Summary</TabsTrigger>
			</TabsList>
			<Button variant="outline" onclick={openPrint}>
				<Printer size={16} />
				Print
			</Button>
		</div>

		<TabsContent value="detail">
			{#if detail.length === 0}
				<Card>
					<CardContent class="py-8 text-center text-muted-foreground">
						No stock movements found for the selected date range.
					</CardContent>
				</Card>
			{:else}
				{#each detailSections as section (section.product_id)}
					<Card class="mb-4">
						<CardHeader>
							<CardTitle>
								{section.product_sku} — {section.product_name}
							</CardTitle>
							<CardDescription>
								{section.category_name ? `${section.category_name} · ` : ''}
								System stock: {section.system_stock}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Date</TableHead>
										<TableHead>Type</TableHead>
										<TableHead>Ref No.</TableHead>
										<TableHead>Counterparty</TableHead>
										<TableHead class="text-right">Qty</TableHead>
										<TableHead class="text-right">Unit Cost</TableHead>
										<TableHead class="text-right">On Hand</TableHead>
										<TableHead class="text-right">Asset Value</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{#each section.lines as line, lineIdx (lineIdx)}
										<TableRow class={line.is_opening ? 'text-muted-foreground italic' : ''}>
											<TableCell>{formatDate(line.txn_date)}</TableCell>
											<TableCell>{line.transaction_type}</TableCell>
											<TableCell>{line.ref_no || '—'}</TableCell>
											<TableCell>{line.counterparty || '—'}</TableCell>
											<TableCell class="text-right font-medium">
												{signedQty(line.quantity)}
											</TableCell>
											<TableCell class="text-right">{formatCurrency(line.unit_cost)}</TableCell>
											<TableCell class="text-right">{line.on_hand_after}</TableCell>
											<TableCell class="text-right">
												{formatCurrency(line.asset_value_after)}
											</TableCell>
										</TableRow>
									{/each}
								</TableBody>
							</Table>

							{#if section.stock_mismatch}
								<p class="mt-2 text-right text-xs text-amber-600 italic">
									Note: reconstructed ending balance does not match the current system stock ({section.system_stock})
									— likely a manual stock edit.
								</p>
							{/if}
						</CardContent>
					</Card>
				{/each}
			{/if}
		</TabsContent>

		<TabsContent value="summary">
			<Card>
				<CardHeader>
					<CardTitle>Inventory Valuation Summary</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Item</TableHead>
								<TableHead>SKU</TableHead>
								<TableHead class="text-right">Opening</TableHead>
								<TableHead class="text-right">+ In</TableHead>
								<TableHead class="text-right">− Out</TableHead>
								<TableHead class="text-right">Ending Stock</TableHead>
								<TableHead class="text-right">Ending Value</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#if summary.length === 0}
								<TableRow>
									<TableCell colspan={7} class="text-center text-muted-foreground">
										No stock movements found for the selected date range.
									</TableCell>
								</TableRow>
							{:else}
								{#each summary as row (row.product_id)}
									<TableRow>
										<TableCell class="font-medium">{row.product_name}</TableCell>
										<TableCell>{row.product_sku}</TableCell>
										<TableCell class="text-right">{row.opening}</TableCell>
										<TableCell class="text-right">{row.qty_in}</TableCell>
										<TableCell class="text-right">{row.qty_out}</TableCell>
										<TableCell class="text-right">{row.ending}</TableCell>
										<TableCell class="text-right">
											{formatCurrency(row.ending_value)}
										</TableCell>
									</TableRow>
								{/each}
							{/if}
						</TableBody>
						{#if summary.length > 0}
							<TableFooter>
								<TableRow class="font-bold">
									<TableCell>Grand Total</TableCell>
									<TableCell></TableCell>
									<TableCell class="text-right">{grandTotals.opening}</TableCell>
									<TableCell class="text-right">{grandTotals.qty_in}</TableCell>
									<TableCell class="text-right">{grandTotals.qty_out}</TableCell>
									<TableCell class="text-right">{grandTotals.ending}</TableCell>
									<TableCell class="text-right">
										{formatCurrency(grandTotals.ending_value)}
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
