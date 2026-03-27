<script lang="ts">
	import StatCard from '$lib/components/common/StatCard.svelte';
	import PageTitle from '$lib/components/layout/PageTitle.svelte';
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
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Clock, Package, TrendingUp, TriangleAlert, ShoppingCart, AlertCircle, Trophy } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let statCards = $derived([
		{
			title: "Today's Sales",
			value: formatCurrency(data.salesStats.todaySales),
			icon: TrendingUp,
			diff: `${data.salesStats.todayOrders}`,
			description: 'orders today',
			variant: 'success'
		},
		{
			title: 'Total Products',
			value: data.inventoryStats.totalItems.toLocaleString(),
			icon: Package,
			diff: undefined as string | undefined,
			description: 'items in inventory',
			variant: 'info'
		},
		{
			title: 'Open Orders',
			value: data.salesStats.openOrders.toLocaleString(),
			icon: Clock,
			diff: undefined as string | undefined,
			description: 'awaiting fulfillment',
			variant: 'success'
		},
		{
			title: 'Low Stock Alerts',
			value: data.inventoryStats.lowStockItems.toLocaleString(),
			icon: TriangleAlert,
			diff: `${data.inventoryStats.outOfStock}`,
			description: 'out of stock',
			variant: data.inventoryStats.lowStockItems > 0 ? 'warning' : 'success'
		}
	]);

	function formatCurrency(value: number) {
		return `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
		switch (status) {
			case 'invoiced':
				return 'default';
			case 'open':
				return 'secondary';
			case 'cancelled':
				return 'destructive';
			default:
				return 'outline';
		}
	}
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

	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Recent Sales Orders -->
		<Card>
			<CardHeader class="flex flex-row items-center gap-2">
				<ShoppingCart class="size-5 text-muted-foreground" />
				<CardTitle>Recent Sales Orders</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Order</TableHead>
							<TableHead>Customer</TableHead>
							<TableHead>Date</TableHead>
							<TableHead class="text-right">Amount</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#if data.recentOrders.length === 0}
							<TableRow>
								<TableCell colspan={5} class="text-center text-muted-foreground">
									No sales orders yet.
								</TableCell>
							</TableRow>
						{:else}
							{#each data.recentOrders as order (order.id)}
								<TableRow>
									<TableCell class="font-medium">SO-{order.id}</TableCell>
									<TableCell>{order.customer_name}</TableCell>
									<TableCell>
										{new Date(order.date_ordered).toLocaleDateString('default', {
											month: 'short',
											day: 'numeric'
										})}
									</TableCell>
									<TableCell class="text-right">
										{formatCurrency(order.total_cost)}
									</TableCell>
									<TableCell>
										<Badge variant={statusVariant(order.order_status ?? 'open')}>
											{order.order_status}
										</Badge>
									</TableCell>
								</TableRow>
							{/each}
						{/if}
					</TableBody>
				</Table>
			</CardContent>
		</Card>

		<!-- Low Stock Items -->
		<Card>
			<CardHeader class="flex flex-row items-center gap-2">
				<AlertCircle class="size-5 text-yellow-500" />
				<CardTitle>Low Stock Items</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Product</TableHead>
							<TableHead>Category</TableHead>
							<TableHead class="text-right">In Stock</TableHead>
							<TableHead class="text-right">Min. Qty</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#if data.lowStockItems.length === 0}
							<TableRow>
								<TableCell colspan={4} class="text-center text-muted-foreground">
									No low stock items. You're all good!
								</TableCell>
							</TableRow>
						{:else}
							{#each data.lowStockItems as item (item.id)}
								<TableRow>
									<TableCell>
										<div>
											<p class="font-medium">{item.purchase_description}</p>
											<p class="text-xs text-muted-foreground">{item.sku}</p>
										</div>
									</TableCell>
									<TableCell>{item.category_name}</TableCell>
									<TableCell class="text-right">
										<span class={item.quantity === 0 ? 'font-bold text-red-500' : 'font-bold text-yellow-500'}>
											{item.quantity}
										</span>
									</TableCell>
									<TableCell class="text-right">{item.minimum_quantity}</TableCell>
								</TableRow>
							{/each}
						{/if}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	</div>

	<!-- Top Selling Products -->
	<Card>
		<CardHeader class="flex flex-row items-center gap-2">
			<Trophy class="size-5 text-yellow-500" />
			<CardTitle>Top Selling Products</CardTitle>
		</CardHeader>
		<CardContent>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="w-10">#</TableHead>
						<TableHead>Product</TableHead>
						<TableHead class="text-right">Qty Sold</TableHead>
						<TableHead class="text-right">Total Revenue</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if data.topProducts.length === 0}
						<TableRow>
							<TableCell colspan={4} class="text-center text-muted-foreground">
								No sales data yet.
							</TableCell>
						</TableRow>
					{:else}
						{#each data.topProducts as product, i (product.product_id)}
							<TableRow>
								<TableCell class="font-bold text-muted-foreground">{i + 1}</TableCell>
								<TableCell>
									<div>
										<p class="font-medium">{product.purchase_description}</p>
										<p class="text-xs text-muted-foreground">{product.sku}</p>
									</div>
								</TableCell>
								<TableCell class="text-right">{product.total_qty_sold}</TableCell>
								<TableCell class="text-right">
									{formatCurrency(product.total_revenue)}
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</CardContent>
	</Card>
</section>
