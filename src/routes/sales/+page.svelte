<script lang="ts">
	import StatCard from '$lib/components/common/StatCard.svelte';
	import PageTitle from '$lib/components/layout/PageTitle.svelte';
	import { PhilippinePeso, ShoppingCart, TrendingUp, Users } from '@lucide/svelte';

	const statCards = [
		{
			title: "Today's Sales",
			value: '₱1,247',
			icon: PhilippinePeso,
			diff: '+12%',
			description: 'vs yesterday',
			variant: 'success'
		},
		{
			title: 'Orders Today',
			value: '23',
			icon: ShoppingCart,
			diff: '+8%',
			description: 'vs yesterday',
			variant: 'success'
		},
		{
			title: 'New Customers',
			value: '5',
			icon: Users,
			diff: '2',
			description: 'vs yesterday',
			variant: 'success'
		},
		{
			title: 'Profit Margin',
			value: '36.5%',
			icon: TrendingUp,
			diff: '-0.2%',
			description: 'vs yesterday',
			variant: 'success'
		}
	];
</script>

<svelte:head>
	<title>RamTech | Sales</title>
	<meta name="description" content="RamTech Sales Dashboard" />
</svelte:head>

<section class="flex flex-col gap-8">
	<PageTitle title="Sales" subTitle="Track and manage your sales orders and revenue." />

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
