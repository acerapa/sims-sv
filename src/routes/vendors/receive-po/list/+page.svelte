<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Plus, Search } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();

	let search = $state('');
	let purchaseOrders = $derived(
		data.purchaseOrders.filter((po) => {
			if (!search) return true;
			const term = search.toLowerCase();
			return (
				po.reference.toLowerCase().includes(term) ||
				(po.supplier_name && po.supplier_name.toLowerCase().includes(term))
			);
		})
	);

	const formatReceiveType = (type: string) => {
		switch (type) {
			case 'with_pay':
				return 'With Pay';
			case 'without_pay':
				return 'Without Pay';
			default:
				return type;
		}
	};
</script>

<svelte:head>
	<title>RamTech | Received Purchase Orders</title>
	<meta name="description" content="Received Purchase Orders" />
</svelte:head>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="space-y-2">
				<CardTitle>Received Purchase Orders</CardTitle>
				<CardDescription>View all received purchase orders</CardDescription>
			</div>
			<a href={resolve('/vendors/receive-po')}>
				<Button>
					<Plus class="size-4" />
					New Receive PO
				</Button>
			</a>
		</div>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="relative">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="search"
				placeholder="Search by reference or supplier..."
				class="h-10 pl-9"
				bind:value={search}
			/>
		</div>

		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Reference</TableHead>
					<TableHead>Supplier</TableHead>
					<TableHead>Date Received</TableHead>
					<TableHead>Type</TableHead>
					<TableHead>Items</TableHead>
					<TableHead>Total</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#if purchaseOrders.length}
					{#each purchaseOrders as po (po.id)}
						<TableRow>
							<TableCell class="font-medium">{po.reference}</TableCell>
							<TableCell>{po.supplier_name || '—'}</TableCell>
							<TableCell>
								{po.receive_date.toLocaleString('default', {
									day: 'numeric',
									month: 'long',
									year: 'numeric'
								})}
							</TableCell>
							<TableCell>{formatReceiveType(po.receive_type)}</TableCell>
							<TableCell>{po.item_count}</TableCell>
							<TableCell>₱{parseFloat(po.total).toFixed(2)}</TableCell>
						</TableRow>
					{/each}
				{:else}
					<TableRow>
						<TableCell colspan={6} class="text-center text-muted-foreground">
							No received purchase orders found.
						</TableCell>
					</TableRow>
				{/if}
			</TableBody>
		</Table>
	</CardContent>
</Card>
