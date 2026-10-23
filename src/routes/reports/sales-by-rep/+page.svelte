<script lang="ts">
	import DatePicker from '$lib/components/common/DatePicker.svelte';
	import PageTitle from '$lib/components/layout/PageTitle.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableFooter,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { ArrowLeft, Printer } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { formatCurrency } from '$lib/utils/common';

	let { data }: PageProps = $props();

	let fromDate = $state<Date | undefined>(
		data.filters.from ? new Date(data.filters.from) : undefined
	);
	let toDate = $state<Date | undefined>(data.filters.to ? new Date(data.filters.to) : undefined);

	const formatDate = (value: Date) =>
		value.toLocaleDateString('default', { day: '2-digit', month: '2-digit', year: 'numeric' });

	function applyFilter() {
		const params = new SvelteURLSearchParams(page.url.searchParams);

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
		const params = new SvelteURLSearchParams();
		if (fromDate) params.set('from', fromDate.toISOString().split('T')[0]);
		if (toDate) params.set('to', toDate.toISOString().split('T')[0]);
		window.open(`/reports/sales-by-rep/print?${params.toString()}`, '_blank');
	}
</script>

<svelte:head>
	<title>RamTech | Sales by Representative</title>
	<meta name="description" content="Sales by Representative Report" />
</svelte:head>

<section class="flex flex-col gap-6">
	<div class="flex flex-col gap-1">
		<Button
			href="/reports"
			variant="ghost"
			class="w-fit cursor-pointer !pl-0 text-muted-foreground hover:bg-slate-50 hover:text-black "
		>
			<ArrowLeft />
			<span class="text-sm">Back to Reports</span>
		</Button>
		<PageTitle
			title="Sales by Representative"
			subTitle="View invoice totals and line details grouped by sales representative."
		/>
	</div>

	<Card>
		<CardContent class="flex items-end gap-4">
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

	<div class="flex items-center justify-end">
		<Button variant="outline" onclick={openPrint}>
			<Printer size={16} />
			Print
		</Button>
	</div>

	<Card>
		<CardContent>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Date</TableHead>
						<TableHead>Invoice No</TableHead>
						<TableHead>Notes</TableHead>
						<TableHead>Item Description</TableHead>
						<TableHead class="text-right">Qty</TableHead>
						<TableHead class="text-right">Sales Price</TableHead>
						<TableHead class="text-right">Amount</TableHead>
						<TableHead class="text-right">Balance</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if data.detailed.length === 0}
						<TableRow>
							<TableCell colspan={8} class="text-center text-muted-foreground">
								No invoices found for the selected date range.
							</TableCell>
						</TableRow>
					{:else}
						{#each data.detailed as rep (rep.rep_name)}
							<TableRow class="bg-muted/50 hover:bg-muted/50">
								<TableCell colspan={8} class="py-2 font-bold">
									{rep.rep_name}
								</TableCell>
							</TableRow>
							{#each rep.invoices as invoice (invoice.invoice_id)}
								{#each invoice.items as item, itemIndex (invoice.invoice_id + '-' + itemIndex)}
									<TableRow>
										<TableCell>{formatDate(invoice.invoice_date)}</TableCell>
										<TableCell>{invoice.invoice_id}</TableCell>
										<TableCell>{invoice.invoice_notes}</TableCell>
										<TableCell class="pl-8">{item.item_name}</TableCell>
										<TableCell class="text-right">{item.item_quantity}</TableCell>
										<TableCell class="text-right">
											{formatCurrency(item.item_price)}
										</TableCell>
										<TableCell class="text-right">
											{formatCurrency(item.item_total)}
										</TableCell>
										<TableCell class="text-right">
											{formatCurrency(invoice.balance)}
										</TableCell>
									</TableRow>
								{/each}
							{/each}
						{/each}
					{/if}
				</TableBody>
				{#if data.detailed.length > 0}
					<TableFooter>
						<TableRow class="font-bold">
							<TableCell colspan={6}>TOTAL</TableCell>
							<TableCell class="text-right">
								{formatCurrency(
									data.detailed.reduce((acc, rep) => acc + rep.subtotal, 0)
								)}
							</TableCell>
							<TableCell class="text-right">
								{formatCurrency(
									data.detailed.reduce(
										(acc, rep) =>
											acc +
											rep.invoices.reduce((sum, invoice) => sum + invoice.balance, 0),
										0
									)
								)}
							</TableCell>
						</TableRow>
					</TableFooter>
				{/if}
			</Table>
		</CardContent>
	</Card>
</section>
