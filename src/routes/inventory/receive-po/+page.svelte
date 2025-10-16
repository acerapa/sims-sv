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
	import { Label } from '$lib/components/ui/label';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { PurchaseOrderItem } from '$lib/types/global';
	import { Plus, Trash2 } from '@lucide/svelte';

	const items = $state<PurchaseOrderItem[]>([
		{
			id: 0,
			product_id: 0,
			quantity: 0,
			unit_cost: 0,
			total_cost: 0
		}
	]);

	const addItem = () => {
		items.push({
			id: items.length + 1,
			product_id: 0,
			quantity: 0,
			unit_cost: 0,
			total_cost: 0
		});
	};

	const removeItem = (index: number) => {
		items.splice(index, 1);
	};
</script>

<svelte:head>
	<title>RamTech | Receive Purchase Order</title>
	<meta name="description" content="Receive Purchase Order Page" />
</svelte:head>

<div class="flex flex-col gap-6">
	<Card class="rounded-lg">
		<CardHeader>
			<CardTitle>Purchase Order Details</CardTitle>
			<CardDescription>Enter the details of the received shipment</CardDescription>
		</CardHeader>
		<CardContent>
			<form class="flex flex-col gap-6">
				<div class="flex flex-wrap gap-6">
					<div class="flex flex-1 flex-col gap-2">
						<Label>PO Reference</Label>
						<Input class="h-10" placeholder="e.g, PO-2024-0001" />
					</div>
					<div class="flex flex-1 flex-col gap-2">
						<Label>Supplier Name</Label>
						<Input class="h-10" placeholder="Enter supplier name" />
					</div>
				</div>
				<div class="flex w-[calc(50%_-_0.75rem)] flex-1 flex-col gap-2">
					<Label>Date Received</Label>
					<Input class="h-10" placeholder="e.g, PO-2024-0001" />
				</div>
				<div class="flex flex-1 flex-col gap-2">
					<Label>Notes</Label>
					<Textarea class="h-10" placeholder="Add any additional notes about this shipment..." />
				</div>
			</form>
		</CardContent>
	</Card>

	<Card class="rounded-lg">
		<CardHeader>
			<div class="flex items-center justify-between">
				<div class="space-y-1.5">
					<CardTitle>Items Received</CardTitle>
					<CardDescription>Add products and quantities received</CardDescription>
				</div>
				<Button onclick={addItem}>
					<Plus />
					Add Item
				</Button>
			</div>
		</CardHeader>
		<CardContent>
			<div class="flex flex-col gap-6">
				<Table class="border-b">
					<TableHeader>
						<TableRow>
							<TableHead>Product</TableHead>
							<TableHead>Quantity Received</TableHead>
							<TableHead>Unit Cost</TableHead>
							<TableHead>Total</TableHead>
							<TableHead></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each items as item, i (item)}
							<TableRow>
								<TableCell>
									<Input type="number" bind:value={items[i].product_id} />
								</TableCell>
								<TableCell>
									<Input type="number" bind:value={items[i].quantity} />
								</TableCell>
								<TableCell>
									<Input type="number" bind:value={items[i].unit_cost} />
								</TableCell>
								<TableCell>
									<p class="font-semibold">₱0.00</p>
								</TableCell>
								<TableCell>
									<Button
										disabled={items.length === 1}
										variant="ghost"
										onclick={() => removeItem(i)}
										class="cursor-pointer text-red-500"
									>
										<Trash2 />
									</Button>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>

				<div class="w-1/2 space-y-3 self-end">
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Subtotal</span>
						<span class="font-medium">₱0.00</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Discount</span>
						<div class="flex items-center gap-4">
							<Input type="number" class="max-w-[120px] text-right" placeholder="0.00" />
							<span class="font-medium">₱0.00</span>
						</div>
					</div>
					<hr />
					<div class="flex items-center justify-between">
						<span class="font-bold">Total value:</span>
						<span class="font-bold">₱0.00</span>
					</div>
				</div>
			</div>
		</CardContent>
	</Card>

	<div class="flex gap-3 self-end">
		<Button variant="outline">Cancel</Button>
		<Button>Receive Items</Button>
	</div>
</div>
