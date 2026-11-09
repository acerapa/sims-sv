<script lang="ts">
	import PageTitle from '$lib/components/layout/PageTitle.svelte';
	import DatePicker from '$lib/components/common/DatePicker.svelte';
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
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import type { PageProps } from './$types';
	import { formatCurrency } from '$lib/utils/common';
	import { formatDate } from '$lib/utils/printables';
	import { buildVendorLedgers, grandTotalBalance } from '$lib/utils/vendor-balance';

	let { data }: PageProps = $props();

	let fromDate = $state<Date | undefined>(
		data.filters.from ? new Date(data.filters.from) : undefined
	);
	let toDate = $state<Date | undefined>(data.filters.to ? new Date(data.filters.to) : undefined);
	let selectedVendor = $state<number | ''>(data.filters.supplierId ?? '');

	let ledgers = $derived(buildVendorLedgers(data.rows));
	let grandTotal = $derived(grandTotalBalance(ledgers));

	function applyFilter() {
		const params = new SvelteURLSearchParams(page.url.searchParams);

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

		if (selectedVendor !== '') {
			params.set('vendor', String(selectedVendor));
		} else {
			params.delete('vendor');
		}

		goto(`?${params.toString()}`, { replaceState: true });
	}

	function clearFilter() {
		fromDate = undefined;
		toDate = undefined;
		selectedVendor = '';
		goto('?', { replaceState: true });
	}

	function openPrint() {
		const params = new SvelteURLSearchParams();
		if (fromDate) params.set('from', fromDate.toISOString());
		if (toDate) params.set('to', toDate.toISOString());
		if (selectedVendor !== '') params.set('vendor', String(selectedVendor));
		window.open(`/reports/vendor-balance-detail/print?${params.toString()}`, '_blank');
	}
</script>

<svelte:head>
	<title>RamTech | Vendor Balance Detail</title>
	<meta name="description" content="Vendor Balance Detail Report" />
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
			title="Vendor Balance Detail"
			subTitle="Running balance owed to each vendor across bills, grouped by vendor."
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
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">Vendor</span>
				<select
					class="h-10 rounded-md border border-input bg-background px-3 text-sm"
					bind:value={selectedVendor}
				>
					<option value="">All Vendors</option>
					{#each data.suppliers as supplier (supplier.id)}
						<option value={supplier.id}>{supplier.name}</option>
					{/each}
				</select>
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
			{#if ledgers.length === 0}
				<p class="py-8 text-center text-muted-foreground">No bills found for the selected range.</p>
			{:else}
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Type</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Num</TableHead>
							<TableHead>Memo</TableHead>
							<TableHead class="text-right">Amount</TableHead>
							<TableHead class="text-right">Balance</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each ledgers as vendor (vendor.supplier_id ?? vendor.supplier_name)}
							<TableRow class="font-bold">
								<TableCell colspan={6}>{vendor.supplier_name}</TableCell>
							</TableRow>
							{#if vendor.opening_balance !== 0}
								<TableRow>
									<TableCell>Opening Balance</TableCell>
									<TableCell></TableCell>
									<TableCell></TableCell>
									<TableCell></TableCell>
									<TableCell class="text-right"></TableCell>
									<TableCell class="text-right">
										{formatCurrency(vendor.opening_balance)}
									</TableCell>
								</TableRow>
							{/if}
							{#each vendor.rows as row (row.bill_id)}
								<TableRow>
									<TableCell>{row.type}</TableCell>
									<TableCell>{formatDate(new Date(row.date).toLocaleString())}</TableCell>
									<TableCell>{row.num}</TableCell>
									<TableCell>{row.memo}</TableCell>
									<TableCell class="text-right">{formatCurrency(row.amount)}</TableCell>
									<TableCell class="text-right">{formatCurrency(row.balance)}</TableCell>
								</TableRow>
							{/each}
							<TableRow class="font-bold">
								<TableCell colspan={4}>Total {vendor.supplier_name}</TableCell>
								<TableCell class="text-right">{formatCurrency(vendor.total_amount)}</TableCell>
								<TableCell class="text-right">{formatCurrency(vendor.ending_balance)}</TableCell>
							</TableRow>
						{/each}
					</TableBody>
					<TableFooter>
						<TableRow class="font-bold">
							<TableCell colspan={5}>TOTAL ALL VENDORS</TableCell>
							<TableCell class="text-right">{formatCurrency(grandTotal)}</TableCell>
						</TableRow>
					</TableFooter>
				</Table>
			{/if}
		</CardContent>
	</Card>
</section>
