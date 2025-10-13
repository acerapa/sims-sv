<script lang="ts">
	import StatCard from '$lib/components/common/StatCard.svelte';
	import PageTitle from '$lib/components/layout/PageTitle.svelte';
	import { Clock, Package, TrendingUp, TriangleAlert } from '@lucide/svelte';

	let statCards = [
		{
			title: 'Total Sales',
			value: '$45,231',
			icon: TrendingUp,
			diff: '+12%',
			description: 'vs last month',
			variant: 'success'
		},
		{
			title: 'Inventory Status',
			value: '2,847',
			icon: Package,
			diff: '98%',
			description: 'items in stock',
			variant: 'info'
		},
		{
			title: 'Pending Orders',
			value: '47',
			icon: Clock,
			diff: '+5',
			description: 'awaiting fulfillment',
			variant: 'success'
		},
		{
			title: 'Low Stock Alerts',
			value: '12',
			icon: TriangleAlert,
			diff: '+3',
			description: 'items need reorder',
			variant: 'warning'
		}
	];
</script>

<svelte:head>
	<title>RamTech | Dashboard</title>
	<meta name="description" content="RamTech Dashboard" />
</svelte:head>

<section class="flex flex-col gap-8">
	<PageTitle
		title="Dashboard"
		subTitle="Welcome back! Here's what's happening with your business today."
	/>

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
</section>
