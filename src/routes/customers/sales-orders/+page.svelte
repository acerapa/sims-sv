<script lang="ts">
	import StatCard from '$lib/components/common/StatCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Table, TableHead, TableHeader } from '$lib/components/ui/table';
	import { DollarSign, Funnel, Search, ShoppingCart, TrendingUp, Users } from '@lucide/svelte';

	const statCards = [
		{
			title: "Today's Sales",
			value: '2,847',
			icon: DollarSign,
			diff: '+45',
			description: 'this month',
			variant: 'success'
		},
		{
			title: 'Orders Today',
			value: '12',
			icon: ShoppingCart,
			diff: '+3',
			description: 'this month',
			variant: 'success'
		},
		{
			title: 'New Customers',
			value: '5',
			icon: Users,
			diff: '2',
			description: 'this month',
			variant: 'success'
		},
		{
			title: 'Profit Margin',
			value: '30%',
			icon: TrendingUp,
			diff: '0.5%',
			description: 'this month',
			variant: 'success'
		}
	];

	let searchValue = $state('');
</script>

<svelte:head>
	<title>RamTech | Sales Orders</title>
	<meta name="description" content="RamTech Inventory Dashboard" />
</svelte:head>

<div class="flex flex-col gap-6">
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

	<Card>
		<CardHeader class="flex items-center justify-between">
			<div class="space-y-1">
				<CardTitle class="text-lg">Sales Orders</CardTitle>
				<CardDescription>Track and manage your orders</CardDescription>
			</div>
			<div class="flex space-x-3">
				<Button variant="outline" class="space-x-2">
					<Funnel />
					<span>Filter</span>
				</Button>
			</div>
		</CardHeader>
		<CardContent class="flex flex-col gap-4">
			<div class="relative">
				<Input
					type="search"
					class="h-10 pl-9"
					placeholder="Search by description..."
					value={searchValue}
				/>
				<Search class="absolute top-1/2 left-3 size-4 translate-y-[-50%] text-muted-foreground" />
			</div>

			<Table>
				<TableHeader>
					<TableHead>Order id</TableHead>
					<TableHead>Date</TableHead>
					<TableHead>Customer</TableHead>
					<TableHead>Product</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Amount</TableHead>
				</TableHeader>
			</Table>
		</CardContent>
	</Card>
</div>
