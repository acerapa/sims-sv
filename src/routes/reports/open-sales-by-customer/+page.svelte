<script lang="ts">
	import DatePicker from '$lib/components/common/DatePicker.svelte';
	import PageTitle from '$lib/components/layout/PageTitle.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { ArrowLeft, Printer } from '@lucide/svelte';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { formatCurrency } from '$lib/utils/common';
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();
	let activeTab = $state('summary');
	let openSalesSummary = $derived(data.summary || []);

	let fromDate = $state<Date | undefined>(
		data.filters.from ? new Date(data.filters.from) : undefined
	);
	let toDate = $state<Date | undefined>(data.filters.to ? new Date(data.filters.to) : undefined);

	let grandTotal = $derived.by(() => {
		const combinedSales = openSalesSummary.map((item) => item.sales).flat();
		return combinedSales.reduce((acc, sales) => acc + (sales ? sales?.total_cost : 0), 0);
	});

	const applyFilter = () => {
		const params = new SvelteURLSearchParams(page.url.searchParams);

		if (fromDate) params.set('from', fromDate.toISOString());
		else params.delete('from');

		if (toDate) params.set('to', toDate.toISOString());
		else params.delete('to');

		goto(resolve(`/reports/open-sales-by-customer?${params.toString()}` as '/reports/open-sales-by-customer'), {replaceState: true})
	};
	const clearFilter = () => {
		fromDate = undefined;
		toDate = undefined;
		goto(resolve(`/reports/open-sales-by-customer?` as '/reports/open-sales-by-customer'), {replaceState: true})
	};
	const openPrint = () => {};
</script>

<svelte:head>
	<title>RamTech | Open Sales by Customer</title>
	<meta name="description" content="OpenSales by Customer Report" />
</svelte:head>

<section class="flex flex-col gap-6 pb-10">
	<div class="flex flex-col gap-1">
		<Button
			href="/reports"
			variant="ghost"
			class="w-fit cursor-pointer !pl-0 text-muted-foreground hover:bg-slate-50 hover:text-black "
		>
			<ArrowLeft />
			<span class="text-sm">Back to Reports</span>
		</Button>
		<PageTitle title="Open Sales by Customer" subTitle="Open purchases history and analytics" />
	</div>
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
					<CardTitle>Open Sales Summary by Customer</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Customer</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>SO Num</TableHead>
								<TableHead>Notes</TableHead>
								<TableHead>Amount</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each openSalesSummary as sale (sale)}
								<TableRow>
									<TableCell colspan={5}>
										<p class="font-bold">{sale.customer}</p>
									</TableCell>
								</TableRow>
								{#each sale.sales as saleItem (saleItem)}
									<TableRow>
										<TableCell class="pl-5">Sales Order</TableCell>
										<TableCell>
											{new Date(saleItem.date_ordered).toLocaleDateString('default', {
												day: 'numeric',
												month: 'long',
												year: 'numeric'
											})}
										</TableCell>
										<TableCell>{saleItem.sales_order_id}</TableCell>
										<TableCell>{saleItem.notes}</TableCell>
										<TableCell>{formatCurrency(saleItem.total_cost)}</TableCell>
									</TableRow>
								{/each}
								<TableRow>
									<TableCell colspan={4}>
										<p class="font-bold">{sale.customer} Total:</p>
									</TableCell>
									<TableCell>
										<p class="font-bold">{formatCurrency(sale.total)}</p>
									</TableCell>
								</TableRow>
								<TableRow>
									<TableCell colspan={5}></TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
					<div class="flex items-center justify-between">
						<p class="text-md font-bold">Grand Total:</p>
						<p class="text-md font-bold">{formatCurrency(grandTotal)}</p>
					</div>
				</CardContent>
			</Card>
		</TabsContent>
		<TabsContent value="detail">
			<Card>
				<CardHeader>
					<CardTitle>Open Sales Detailed by Customer</CardTitle>
				</CardHeader>
				<CardContent></CardContent>
			</Card>
		</TabsContent>
	</Tabs>
</section>
