<script lang="ts">
	import StatCard from '$lib/components/common/StatCard.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import {
		DollarSign,
		Ellipsis,
		FileText,
		Funnel,
		Plus,
		Search,
		ShoppingCart,
		TrendingUp,
		Users
	} from '@lucide/svelte';
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();

	let salesOrders = $derived(data.salesOrders);
	let stats = $derived(data.salesOrderStats);

	const statCards = $derived([
		{
			title: "Today's Sales",
			value: `₱${stats.todaySales.toLocaleString()}`,
			icon: DollarSign,
			description: `${stats.todayOrders} order(s) today`,
			variant: 'success'
		},
		{
			title: 'Total Orders',
			value: stats.totalOrders.toLocaleString(),
			icon: ShoppingCart,
			description: `${stats.openOrders} open`,
			variant: 'success'
		},
		{
			title: 'Total Customers',
			value: stats.totalCustomers.toLocaleString(),
			icon: Users,
			description: 'registered customers',
			variant: 'success'
		},
		{
			title: 'Total Sales',
			value: `₱${stats.totalSales.toLocaleString()}`,
			icon: TrendingUp,
			description: 'all-time revenue',
			variant: 'success'
		}
	]);

	let searchValue = $state('');

	const getStatusVariant = (status: string) => {
		switch (status) {
			case 'open':
				return 'default';
			case 'partially_invoiced':
				return 'outline';
			case 'invoiced':
				return 'secondary';
			case 'cancelled':
				return 'destructive';
			default:
				return 'outline';
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'open':
				return 'Open';
			case 'partially_invoiced':
				return 'Partially Invoiced';
			case 'invoiced':
				return 'Invoiced';
			case 'cancelled':
				return 'Cancelled';
			default:
				return status;
		}
	};

	const onCreateInvoice = (orderId: number) => {
		goto(resolve(`/customers/invoices/form?sales_order_id=${orderId}` as '/customers/invoices/form'));
	};
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
				<Button href="/customers/sales-orders/form">
					<Plus class="size-4" />
					Add Order
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
					<TableRow>
						<TableHead>Order ID</TableHead>
						<TableHead>Date</TableHead>
						<TableHead>Customer</TableHead>
						<TableHead>Items</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Amount</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each salesOrders as order (order.id)}
						<TableRow>
							<TableCell class="font-medium">SO-{order.id}</TableCell>
							<TableCell>
								{new Date(order.date_ordered).toLocaleDateString('default', {
									day: 'numeric',
									month: 'short',
									year: 'numeric'
								})}
							</TableCell>
							<TableCell>{order.customer_name}</TableCell>
							<TableCell>{order.item_count} item(s)</TableCell>
							<TableCell>
								<Badge variant={getStatusVariant(order.order_status || 'open')}>
									{getStatusLabel(order.order_status || 'open')}
								</Badge>
							</TableCell>
							<TableCell class="font-medium">₱{order.total_cost.toLocaleString()}</TableCell>
							<TableCell>
								{#if order.order_status !== 'invoiced' && order.order_status !== 'cancelled'}
									<DropdownMenu>
										<DropdownMenuTrigger class={buttonVariants({ variant: 'ghost', size: 'sm' })}>
											<Ellipsis />
										</DropdownMenuTrigger>
										<DropdownMenuContent>
											<DropdownMenuItem onSelect={() => onCreateInvoice(order.id)} class="space-x-2">
												<FileText />
												<span>Create Invoice</span>
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								{/if}
							</TableCell>
						</TableRow>
					{/each}
					{#if salesOrders.length === 0}
						<TableRow>
							<TableCell colspan={7} class="text-center text-muted-foreground">
								No sales orders found
							</TableCell>
						</TableRow>
					{/if}
				</TableBody>
			</Table>
		</CardContent>
	</Card>
</div>
