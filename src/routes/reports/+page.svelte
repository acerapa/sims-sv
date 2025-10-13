<script lang="ts">
	import StatCard from '$lib/components/common/StatCard.svelte';
	import PageTitle from '$lib/components/layout/PageTitle.svelte';
	import { TrendingUp } from '@lucide/svelte';

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
</script>

<svelte:head>
	<title>RamTech | Reports</title>
	<meta name="description" content="RamTech Reports" />
</svelte:head>

<section class="flex flex-col gap-8">
	<PageTitle title="Reports" subTitle="Generate and view business performance reports." />

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
