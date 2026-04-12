<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
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
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let order = $derived(data.salesOrder);

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
</script>

<svelte:head>
	<title>RamTech | Sales Order SO-{order.id}</title>
	<meta name="description" content="Sales order details" />
</svelte:head>

<div class="flex flex-col gap-6">
	<Card class="rounded-lg">
		<CardHeader class="flex items-center justify-between">
			<div class="space-y-1">
				<CardTitle class="text-lg">Sales Order SO-{order.id}</CardTitle>
				<CardDescription>Order details and items</CardDescription>
			</div>
			<Badge variant={getStatusVariant(order.order_status || 'open')}>
				{getStatusLabel(order.order_status || 'open')}
			</Badge>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-2 gap-6 md:grid-cols-4">
				<div>
					<p class="text-sm text-muted-foreground">Customer</p>
					<p class="font-medium">{order.customer?.name || '—'}</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">Sales Person</p>
					<p class="font-medium">{order.staff?.name || '—'}</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">Date Ordered</p>
					<p class="font-medium">
						{new Date(order.date_ordered).toLocaleDateString('default', {
							day: 'numeric',
							month: 'short',
							year: 'numeric'
						})}
					</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">Order Type</p>
					<p class="font-medium capitalize">{order.order_type}</p>
				</div>
				{#if order.notes}
					<div class="col-span-full">
						<p class="text-sm text-muted-foreground">Notes</p>
						<p class="font-medium">{order.notes}</p>
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>

	<Card class="rounded-lg">
		<CardHeader>
			<CardTitle>Order Items</CardTitle>
		</CardHeader>
		<CardContent>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Product</TableHead>
						<TableHead>S/N</TableHead>
						<TableHead>Quantity</TableHead>
						<TableHead>Unit Price (₱)</TableHead>
						<TableHead>Total (₱)</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each order.items as item (item.id)}
						<TableRow>
							<TableCell>{item.product?.sales_description || '—'}</TableCell>
							<TableCell>{item.serial_number || '—'}</TableCell>
							<TableCell>{item.quantity}</TableCell>
							<TableCell>₱{parseFloat(item.unit_price as string).toFixed(2)}</TableCell>
							<TableCell class="font-medium">
								₱{parseFloat(item.total_price as string).toFixed(2)}
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>

			<div class="mt-4 ml-auto w-1/2 space-y-2">
				<div class="flex items-center justify-between">
					<span class="font-bold">Total:</span>
					<span class="font-bold">₱{order.total_cost.toLocaleString()}</span>
				</div>
			</div>
		</CardContent>
	</Card>

	<div class="flex gap-3 self-start">
		<Button variant="outline" href="/customers/sales-orders">Back to Sales Orders</Button>
	</div>
</div>
