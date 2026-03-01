<script lang="ts">
	import PageTitle from '$lib/components/layout/PageTitle.svelte';
	import DatePicker from '$lib/components/common/DatePicker.svelte';
	import { Button } from '$lib/components/ui/button';
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
	import type { VendorDetailRow } from '$lib/server/db/queries/reports';

	let { data }: PageProps = $props();

	let fromDate = $state<Date | undefined>(
		data.filters.from ? new Date(data.filters.from) : undefined
	);
	let toDate = $state<Date | undefined>(
		data.filters.to ? new Date(data.filters.to) : undefined
	);

	let activeTab = $state('summary');

	let summary = $derived(data.summary);
	let detail = $derived(data.detail);

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

	function formatCurrency(value: string | number) {
		const num = typeof value === 'string' ? parseFloat(value || '0') : value;
		return `₱${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}
</script>

<svelte:head>
	<title>RamTech | Purchases by Vendor</title>
	<meta name="description" content="Purchases by Vendor Report" />
</svelte:head>

<section class="flex flex-col gap-6">
	<PageTitle
		title="Purchases by Vendor"
		subTitle="View purchase order totals and details grouped by vendor."
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
		<TabsList>
			<TabsTrigger value="summary">Summary</TabsTrigger>
			<TabsTrigger value="detail">Detail</TabsTrigger>
		</TabsList>

		<TabsContent value="summary">
			<Card>
				<CardHeader>
					<CardTitle>Purchase Summary by Vendor</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Vendor Name</TableHead>
								<TableHead class="text-right"># of POs</TableHead>
								<TableHead class="text-right">Total Items Received</TableHead>
								<TableHead class="text-right">Total Amount</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#if summary.length === 0}
								<TableRow>
									<TableCell colspan={4} class="text-center text-muted-foreground">
										No purchase orders found for the selected date range.
									</TableCell>
								</TableRow>
							{:else}
								{#each summary as row (row.supplier_id)}
									<TableRow>
										<TableCell class="font-medium">{row.supplier_name}</TableCell>
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
			{#if detailGrouped.length === 0}
				<Card>
					<CardContent class="py-8 text-center text-muted-foreground">
						No purchase orders found for the selected date range.
					</CardContent>
				</Card>
			{:else}
				{#each detailGrouped as vendor (vendor.supplier_id)}
					<Card class="mb-4">
						<CardHeader>
							<CardTitle>{vendor.supplier_name}</CardTitle>
						</CardHeader>
						<CardContent class="space-y-6">
							{#each vendor.pos as po (po.po_id)}
								<div>
									<div class="mb-2 flex items-center gap-4 text-sm text-muted-foreground">
										<span class="font-semibold text-foreground">{po.po_reference}</span>
										<span>
											{new Date(po.receive_date).toLocaleDateString('default', {
												day: 'numeric',
												month: 'long',
												year: 'numeric'
											})}
										</span>
									</div>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Product</TableHead>
												<TableHead class="text-right">Qty</TableHead>
												<TableHead class="text-right">Unit Cost</TableHead>
												<TableHead class="text-right">Total Cost</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{#each po.items as item}
												<TableRow>
													<TableCell>{item.product_name}</TableCell>
													<TableCell class="text-right">{item.quantity}</TableCell>
													<TableCell class="text-right">
														{formatCurrency(item.cost)}
													</TableCell>
													<TableCell class="text-right">
														{formatCurrency(item.total_cost)}
													</TableCell>
												</TableRow>
											{/each}
										</TableBody>
									</Table>
								</div>
							{/each}

							<div class="flex justify-end border-t pt-2">
								<span class="mr-4 font-semibold">Subtotal:</span>
								<span class="font-bold">{formatCurrency(vendor.subtotal)}</span>
							</div>
						</CardContent>
					</Card>
				{/each}
			{/if}
		</TabsContent>
	</Tabs>
</section>
