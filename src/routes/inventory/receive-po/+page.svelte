<script>
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
	import { Plus } from '@lucide/svelte';
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
				<Button>
					<Plus />
					Add Item
				</Button>
			</div>
		</CardHeader>
		<CardContent>
			<Table>
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
					<TableRow>
						<TableCell></TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</CardContent>
	</Card>
</div>
