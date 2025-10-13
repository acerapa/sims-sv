<script lang="ts">
	import StatCard from '$lib/components/common/StatCard.svelte';
	import { Package, TrendingDown, TriangleAlert } from '@lucide/svelte';
	import { setContext } from 'svelte';

	setContext('pageTitle', {
		title: 'Inventory',
		subTitle: 'Monitor your product stock levels and inventory status.'
	});

	const statCards = [
		{
			title: 'Total Items',
			value: '2,847',
			icon: Package,
			diff: '+45',
			description: 'this month',
			variant: 'success'
		},
		{
			title: 'Low Stock items',
			value: '12',
			icon: TriangleAlert,
			diff: '+3',
			description: 'this month',
			variant: 'warning'
		},
		{
			title: 'Out of Stock',
			value: '5',
			icon: TrendingDown,
			diff: '-2',
			description: 'this month',
			variant: 'danger'
		},
		{
			title: 'Total Value',
			value: '₱89,432',
			icon: Package,
			diff: '+₱9,432',
			description: 'this month',
			variant: 'success'
		}
	];
</script>

<svelte:head>
	<title>RamTech | Inventory</title>
	<meta name="description" content="RamTech Inventory Dashboard" />
</svelte:head>

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
