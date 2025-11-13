<script lang="ts">
	import { enhance } from '$app/forms';
	import DatePicker from '$lib/components/common/DatePicker.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Select,
		SelectContent,
		SelectGroup,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';
	import {
		Sheet,
		SheetClose,
		SheetContent,
		SheetDescription,
		SheetFooter,
		SheetHeader,
		SheetTitle,
		SheetTrigger
	} from '$lib/components/ui/sheet';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { Supplier, SupplierPO } from '$lib/types/global';
	import { Plus } from '@lucide/svelte';

	interface Props {
		suppliers: Supplier[];
	}
	let { suppliers = [] }: Props = $props();

	let open = $state(false);
	let selectedSupplierId = $state('');
	let fetchPOBySupplier: HTMLFormElement;
	let selectedSupplier = $derived.by(() => {
		return suppliers.find((supplier) => supplier.id === parseInt(selectedSupplierId));
	});
	let selectedPORef = $state('');
	let supplierPOs = $state<SupplierPO[]>([]);
	let selectedPO = $derived.by(() => {
		return supplierPOs.find((po) => po.reference === selectedPORef);
	});
	let selectedPaymentMethod = $state('');

	$effect(() => {
		if (selectedSupplierId) {
			supplierPOs = [];
			fetchPOBySupplier.requestSubmit();
		}
	});
</script>

<form
	action="?/getSupplierRelatedPO"
	method="post"
	bind:this={fetchPOBySupplier}
	use:enhance={() => {
		return async ({ result }) => {
			if (result.type === 'success') {
				if (result.data) {
					supplierPOs = result.data as unknown as SupplierPO[];
				}
			}
		};
	}}
>
	<input type="hidden" name="supplier_id" value={selectedSupplierId} />
</form>

<Sheet bind:open>
	<SheetTrigger class={buttonVariants({ variant: 'default' })}>
		<Plus class="size-4" />
		Add Bill
	</SheetTrigger>
	<SheetContent
		trapFocus={false}
		side="right"
		class="overflow-x-hidden overflow-y-auto sm:!max-w-2xl"
	>
		<SheetHeader>
			<SheetTitle>Add New Bill</SheetTitle>
			<SheetDescription>Fill in the details to add a new bill</SheetDescription>
		</SheetHeader>
		<form action="" method="post">
			<div class="flex flex-col gap-6 px-6">
				<Card>
					<CardHeader>
						<CardTitle>Bill Details</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex flex-col gap-6">
							<div class="space-y-2">
								<Label>Supplier</Label>
								<div>
									<Select type="single" bind:value={selectedSupplierId}>
										<SelectTrigger class="w-full">
											{selectedSupplier ? selectedSupplier.name : 'Select supplier'}
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{#each suppliers as supplier (supplier.id)}
													<SelectItem value={supplier.id.toString()}>{supplier.name}</SelectItem>
												{/each}
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>
							</div>
							<div class="space-y-2">
								<Label>Linked PO</Label>
								<div>
									<Select type="single" bind:value={selectedPORef}>
										<SelectTrigger class="w-full">
											{selectedPO ? selectedPO.reference : 'Select supplier'}
										</SelectTrigger>
										<SelectContent>
											{#if supplierPOs.length === 0 && !selectedSupplierId}
												<SelectGroup>
													<SelectItem value="" disabled>No supplier selected</SelectItem>
												</SelectGroup>
											{:else if supplierPOs.length === 0 && selectedSupplierId}
												<SelectGroup>
													<SelectItem value="" disabled>No POs found</SelectItem>
												</SelectGroup>
											{:else}
												<SelectGroup>
													{#each supplierPOs as po, ndx (ndx)}
														<SelectItem value={po.reference}>{po.reference}</SelectItem>
													{/each}
												</SelectGroup>
											{/if}
										</SelectContent>
									</Select>
								</div>
							</div>
							<div class="space-y-2">
								<Label>Bill Date</Label>
								<DatePicker name="bill_date" />
							</div>
							<div class="space-y-2">
								<Label>Due Date</Label>
								<DatePicker name="due_date" />
							</div>
							<div class="space-y-2">
								<Label>Notes</Label>
								<Textarea name="notes" placeholder="Add any notes about this bill..." />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Items</CardTitle>
						<CardContent class="!px-0">
							<Table class="mt-4">
								<TableHeader>
									<TableRow>
										<TableHead class="!text-sm font-medium text-primary">Product</TableHead>
										<TableHead class="!text-sm font-medium text-primary">
											Quantity Received
										</TableHead>
										<TableHead class="text-end !text-sm font-medium text-primary">
											Unit Cost
										</TableHead>
										<TableHead class="text-end !text-sm font-medium text-primary">Total</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{#if selectedPO?.po_items}
										{#each selectedPO?.po_items as item, ndx (ndx)}
											<TableRow class="last:!border-b">
												<TableCell>{item.name}</TableCell>
												<TableCell>{item.quantity}</TableCell>
												<TableCell class="text-end">{item.cost.toFixed(2)}</TableCell>
												<TableCell class="text-end">{item.total_cost.toFixed(2)}</TableCell>
											</TableRow>
										{/each}
									{:else}
										<TableRow>
											<TableCell colspan={4} class="text-center">No items found</TableCell>
										</TableRow>
									{/if}
								</TableBody>
							</Table>
							{#if selectedPO}
								<div class="mt-4 ml-auto w-1/2 space-y-3">
									<div class="flex items-center justify-between">
										<span class="text-sm text-muted-foreground">Subtotal</span>
										<span class="text-sm">{selectedPO?.sub_total.toFixed(2)}</span>
									</div>
									<div class="flex items-center justify-between border-b">
										<span class="text-sm text-muted-foreground">Discount (₱)</span>
										<span class="text-sm">{selectedPO?.discount.toFixed(2)}</span>
									</div>
									<div class="flex items-center justify-between">
										<span class="text-sm font-semibold">Total</span>
										<span class="text-sm">{selectedPO?.total.toFixed(2)}</span>
									</div>
								</div>
							{/if}
						</CardContent>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Payment Details</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex flex-col gap-6">
							<div class="space-y-2">
								<Label>Payment Method</Label>
								<Select type="single" bind:value={selectedPaymentMethod}>
									<SelectTrigger class="w-full">Select Payment Method</SelectTrigger>
									<SelectContent>
										<SelectItem value="cash">Cash</SelectItem>
										<SelectItem value="check">Check</SelectItem>
									</SelectContent>
								</Select>
							</div>
							{#if selectedPaymentMethod === 'check'}
								<div class="space-y-2">
									<Label>Check Number</Label>
									<Input type="texxt" name="check_number" placeholder="Enter Check number" />
								</div>
							{/if}
							<div class="space-y-2">
								<Label>Amount</Label>
								<Input type="number" name="amount" placeholder="Enter amount" />
							</div>
						</div>
					</CardContent>
				</Card>
				<SheetFooter class="flex-row justify-end">
					<SheetClose class={buttonVariants({ variant: 'outline' })}>Cancel</SheetClose>
					<Button variant="default">Add Bill</Button>
				</SheetFooter>
			</div>
		</form>
	</SheetContent>
</Sheet>
