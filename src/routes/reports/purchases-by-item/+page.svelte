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
	import { groupDetailByCategory } from './pdf';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let fromDate = $state<Date | undefined>(
		data.filters.from ? new Date(data.filters.from) : undefined
	);
	let toDate = $state<Date | undefined>(data.filters.to ? new Date(data.filters.to) : undefined);

	let activeTab = $state('summary');

	let summary = $derived(data.summary);
	let detail = $derived(data.detail);

	let grandTotals = $derived({
		po_count: summary.reduce((sum, row) => sum + row.po_count, 0),
		total_items: summary.reduce((sum, row) => sum + row.total_items, 0),
		total_amount: summary.reduce((sum, row) => sum + parseFloat(row.total_amount || '0'), 0)
	});

	function applyFilter() {
		const params = new URLSearchParams(page.url.searchParams);

		if (fromDate) {
			params.set('from', fromDate.toISOString());
		} else {
			params.delete('from');
		}

		if (toDate) {
			params.set('to', toDate.toISOString());
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
		if (fromDate) params.set('from', fromDate.toISOString());
		if (toDate) params.set('to', toDate.toISOString());
		window.open(`/reports/purchases-by-item/print?${params.toString()}`, '_blank');
	}

	function formatCurrency(value: string | number) {
		const num = typeof value === 'string' ? parseFloat(value || '0') : value;
		return `₱${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	function formatDate(value: string) {
		return new Date(value).toLocaleDateString('default', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>RamTech | Purchases by Item</title>
	<meta name="description" content="Purchases by Item Report" />
</svelte:head>

<section class="flex flex-col gap-6">
	<PageTitle
		title="Purchases by Item"
		subTitle="Purchase summary by item category, or every purchase line with a running balance."
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

	<Tabs bind:value={activeTab}>
		<div class="flex items-center justify-between">
			<TabsList>
				<TabsTrigger value="summary">Summary</TabsTrigger>
				<TabsTrigger value="detail">Detail</TabsTrigger>
			</TabsList>
			<Button variant="outline" onclick={openPrint}>
				<Printer size={16} />
				Print
			</Button>
		</div>

		<TabsContent value="summary">
			<Card>
				<CardHeader>
					<CardTitle>Purchase Summary by Category</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Category Name</TableHead>
								<TableHead class="text-right"># of POs</TableHead>
								<TableHead class="text-right">Total Items Purchased</TableHead>
								<TableHead class="text-right">Total Amount</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#if summary.length === 0}
								<TableRow>
									<TableCell colspan={4} class="text-center text-muted-foreground">
										No purchases found for the selected date range.
									</TableCell>
								</TableRow>
							{:else}
								{#each summary as row (row.category_id)}
									<TableRow>
										<TableCell class="font-medium">{row.category_name}</TableCell>
										<TableCell class="text-right">{row.po_count}</TableCell>
										<TableCell class="text-right">{row.total_items}</TableCell>
										<TableCell class="text-right">
											{formatCurrency(row.total_amount)}
										</TableCell>
									</TableRow>
								{/each}
							{/if}
						</TableBody>
						{#if summary.length > 0}
							<TableFooter>
								<TableRow class="font-bold">
									<TableCell>Grand Total</TableCell>
									<TableCell class="text-right">{grandTotals.po_count}</TableCell>
									<TableCell class="text-right">{grandTotals.total_items}</TableCell>
									<TableCell class="text-right">
										{formatCurrency(grandTotals.total_amount)}
									</TableCell>
								</TableRow>
							</TableFooter>
						{/if}
					</Table>
				</CardContent>
			</Card>
		</TabsContent>

		<TabsContent value="detail">
			{#if detail.length === 0}
			<Card>
				<CardContent class="py-8 text-center text-muted-foreground">
					No purchases found for the selected date range.
				</CardContent>
			</Card>
		{:else}
			{#each groupDetailByCategory(detail) as section (section.category_id)}
				<Card class="mb-4">
					<CardHeader>
						<CardTitle>{section.category_name}</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Type</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Ref No.</TableHead>
									<TableHead>Memo</TableHead>
									<TableHead>Vendor</TableHead>
									<TableHead>Item</TableHead>
									<TableHead class="text-right">Qty</TableHead>
									<TableHead class="text-right">Cost Price</TableHead>
									<TableHead class="text-right">Amount</TableHead>
									<TableHead class="text-right">Balance</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each section.lines as line}
									<TableRow>
										<TableCell>{line.transaction_type}</TableCell>
										<TableCell>{formatDate(line.receive_date)}</TableCell>
										<TableCell>{line.po_reference}</TableCell>
										<TableCell>{line.memo}</TableCell>
										<TableCell>{line.supplier_name}</TableCell>
										<TableCell class="font-medium">{line.product_name}</TableCell>
										<TableCell class="text-right">{line.quantity}</TableCell>
										<TableCell class="text-right">{formatCurrency(line.cost)}</TableCell>
										<TableCell class="text-right">{formatCurrency(line.total_cost)}</TableCell>
										<TableCell class="text-right">{formatCurrency(line.running_balance)}</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>

						<div class="flex justify-end border-t pt-2">
							<span class="mr-4 font-semibold">Subtotal:</span>
							<span class="font-bold">{formatCurrency(section.subtotal)}</span>
						</div>
					</CardContent>
				</Card>
			{/each}
		{/if}
		</TabsContent>
	</Tabs>
</section>
