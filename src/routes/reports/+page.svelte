<script lang="ts">
	// import StatCard from '$lib/components/common/StatCard.svelte';
	import PageTitle from '$lib/components/layout/PageTitle.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardTitle } from '$lib/components/ui/card';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import { ChartColumn, NotepadText, Package, ShoppingCart } from '@lucide/svelte';

	const reports = {
		sales: [
			{
				title: 'Daily Sales Summary',
				subtitle: 'Detailed breakdown of daily sales performance and trends'
			},
			{
				title: 'Monthly Revenue Report',
				subtitle: 'Comprehensive monthly revenue analysis with comparisons'
			},
			{
				title: 'Sales by Product',
				subtitle: 'Product-wise sales performance and ranking'
			},
			{
				title: 'Sales by Customer',
				subtitle: 'Customer purchase history and analytics'
			}
		],
		inventory: [
			{
				title: 'Current Stock Levels',
				subtitle: 'Real-time inventory status across all locations'
			},
			{
				title: 'Stock Movement Report',
				subtitle: 'Track inventory movements and transfers'
			},
			{
				title: 'Low Stock Alert',
				subtitle: 'Products below minimum threshold'
			}
		],
		purchasing: [
			{
				title: 'Purchase Order Report',
				subtitle: 'All purchase orders with status tracking'
			},
			{
				title: 'Supplier Performance',
				subtitle: 'Supplier delivery and quality metrics'
			},
			{
				title: 'Purchase History',
				subtitle: 'Historical purchase data and trends'
			}
		]
	};

	type ReportType = 'sales' | 'inventory' | 'purchasing';
	let reportSelected = $state<ReportType>('sales');

	const onSelectReport = (report: ReportType) => {
		reportSelected = report;
	};
</script>

<svelte:head>
	<title>RamTech | Reports</title>
	<meta name="description" content="RamTech Reports" />
</svelte:head>

<section class="flex flex-col gap-8">
	<PageTitle title="Reports" subTitle="Generate and view business performance reports." />

	<div class="flex w-full items-start gap-6">
		<div class="flex gap-4 [&_[data-slot='card']]:w-full [&_[data-slot='card']]:max-w-72">
			<Card class="!p-3">
				<CardContent class="space-y-4 !p-0">
					<p class="text-sm font-semibold text-muted-foreground">Report Categories</p>
					<div class="flex flex-col gap-1">
						<Button
							variant={reportSelected !== 'sales' ? 'ghost' : 'default'}
							class="justify-start"
							size="lg"
							onclick={() => onSelectReport('sales')}
						>
							<ChartColumn />
							Sales Reports
						</Button>
						<Button
							variant={reportSelected !== 'inventory' ? 'ghost' : 'default'}
							class="justify-start"
							size="lg"
							onclick={() => onSelectReport('inventory')}
						>
							<Package />
							Inventory Reports
						</Button>
						<Button
							variant={reportSelected !== 'purchasing' ? 'ghost' : 'default'}
							class="justify-start"
							size="lg"
							onclick={() => onSelectReport('purchasing')}
						>
							<ShoppingCart />
							Purchasing Reports
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
		<div class="grid flex-1 grid-cols-3 gap-6">
			{#each reports[reportSelected] as report, ndx (ndx)}
				<Card class="w-full max-w-xs">
					<CardHeader>
						<CardTitle>{report.title}</CardTitle>
						<CardDescription>{report.subtitle}</CardDescription>
					</CardHeader>
					<CardContent>
						<Button variant="outline" class="w-full" size="lg">
							<NotepadText />
							View Report
						</Button>
					</CardContent>
				</Card>
			{/each}
		</div>
	</div>
</section>
