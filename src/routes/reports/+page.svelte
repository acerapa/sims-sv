<script lang="ts">
	import StatCard from '$lib/components/common/StatCard.svelte';
	import PageTitle from '$lib/components/layout/PageTitle.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { ChartColumn, Package, ShoppingCart, TrendingUp } from '@lucide/svelte';

	let statCards = [
		{
			title: 'Total Revenue',
			value: '₱124,592',
			icon: TrendingUp,
			diff: '+12.5%',
			description: 'this month',
			variant: 'success'
		},
		{
			title: 'Orders Processed',
			value: '1,247',
			icon: TrendingUp,
			diff: '+8.2%',
			description: 'this month',
			variant: 'success'
		},
		{
			title: 'New Customers',
			value: '89',
			icon: TrendingUp,
			diff: '+15.3%',
			description: 'this month',
			variant: 'success'
		},
		{
			title: 'Products Sold',
			value: '3,421',
			icon: TrendingUp,
			diff: '+6.7%',
			description: 'this month',
			variant: 'success'
		}
	];

	let showStatCards = $state(false);
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

	<div class="flex gap-4 [&_[data-slot='card']]:w-full [&_[data-slot='card']]:max-w-72">
		<Card class="!p-3">
			<CardContent class="space-y-4 !p-0">
				<p class="text-sm font-semibold text-muted-foreground">Report Categories</p>
				<div class="flex flex-col gap-1">
					<Button
						variant={reportSelected !== 'sales' ? 'ghost' : 'default'}
						class="h-10 justify-start"
						onclick={() => onSelectReport('sales')}
					>
						<ChartColumn />
						Sales Reports
					</Button>
					<Button
						variant={reportSelected !== 'inventory' ? 'ghost' : 'default'}
						class="h-10 justify-start"
						onclick={() => onSelectReport('inventory')}
					>
						<Package />
						Inventory Reports
					</Button>
					<Button
						variant={reportSelected !== 'purchasing' ? 'ghost' : 'default'}
						class="h-10 justify-start"
						onclick={() => onSelectReport('purchasing')}
					>
						<ShoppingCart />
						Purchasing Reports
					</Button>
				</div>
			</CardContent>
		</Card>
	</div>
	{#if showStatCards}
		<div class="grid gap-6 lg:grid-cols-4">
			{#each statCards as stat (stat.title)}
				<StatCard
					title={stat.title}
					value={stat.value}
					icon={stat.icon}
					diff={stat.diff}
					description={stat.description}
					variant={stat.variant}
				/>
			{/each}
		</div>
	{/if}
</section>
