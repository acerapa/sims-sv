<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
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
	import type { ActionData } from '../../../../../routes/vendors/bills/$types';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';

	interface Bill {
		id: number;
		supplier_id: number;
		purchase_order_id: number;
		bill_date: Date;
		due_date: Date;
		notes: string | null;
		payment_type: 'check' | 'cash';
		check_number: string | null;
		bill_status: string;
		total_amount: string;
		paid_amount: string;
		supplier_name: string | null;
		po_reference: string | null;
	}

	interface Props {
		suppliers: Supplier[];
		form?: ActionData;
		bill?: Bill | null;
		hasTrigger?: boolean;
		open?: boolean;
	}
	let {
		suppliers = [],
		form,
		bill = null,
		hasTrigger = true,
		open = $bindable(false)
	}: Props = $props();

	let edit = $state(false);
	let errors = $derived(form?.error);
	let selectedSupplierId = $derived(bill?.supplier_id?.toString() || '');
	let fetchPOBySupplier: HTMLFormElement;
	let selectedSupplier = $derived.by(() => {
		return suppliers.find((supplier) => supplier.id === parseInt(selectedSupplierId));
	});
	let selectedPOId = $derived(bill?.purchase_order_id?.toString() || '');
	let supplierPOs = $state<SupplierPO[]>([]);
	let selectedPO = $derived.by(() => {
		return supplierPOs.find((po) => po.id === parseInt(selectedPOId));
	});
	let selectedPaymentMethod = $derived(bill?.payment_type || '');
	let paidAmount = $derived(bill?.paid_amount ? parseFloat(bill.paid_amount) : 0);
	let checkNumber = $derived(bill?.check_number || '');
	let notes = $derived(bill?.notes || '');
	let billDate = $derived(bill?.bill_date);
	let dueDate = $derived(bill?.due_date);
	let billStatus = $derived.by(() => {
		if (!selectedPO && !paidAmount) return bill?.bill_status || '';

		return selectedPO?.total == paidAmount ? 'paid' : 'partial';
	});

	const enhanceForm: SubmitFunction = async () => {
		return async ({ result }) => {
			applyAction(result);

			if (result.type === 'success') {
				await invalidate('vendors:bills');
				toast.success(edit ? 'Bill updated successfully' : 'Bill created successfully');
				open = false;
				edit = false;
			} else {
				toast.error(edit ? 'Failed to update bill' : 'Failed to create bill');
			}
		};
	};

	const handleFormClose = (status: boolean) => {
		if (!status) {
			goto(resolve('/vendors/bills'));
		}
	};

	$effect(() => {
		if (selectedSupplierId) {
			supplierPOs = [];
			fetchPOBySupplier.requestSubmit();
		}

		if (!open) {
			edit = false;
			bill = null;
			edit = false;

			if (form) {
				form = null;
			}
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

<Sheet bind:open onOpenChangeComplete={(e) => handleFormClose(e)}>
	{#if hasTrigger}
		<SheetTrigger class={buttonVariants({ variant: 'default' })}>
			<Plus class="size-4" />
			Add Bill
		</SheetTrigger>
	{/if}
	<SheetContent
		trapFocus={false}
		side="right"
		class="overflow-x-hidden overflow-y-auto sm:!max-w-2xl"
	>
		<SheetHeader class="mt-5 flex-row items-center justify-between">
			<div class="space-y-1">
				<SheetTitle>{bill ? (edit ? 'Edit Bill' : 'View Bill') : 'Add New Bill'}</SheetTitle>
				<SheetDescription>
					{bill
						? edit
							? 'Update the bill details'
							: 'View the bill details'
						: 'Fill in the details to add a new bill'}
				</SheetDescription>
			</div>
			{#if bill}
				{#if edit}
					<Button onclick={() => (edit = false)} variant="outline">Cancel</Button>
				{:else}
					<Button onclick={() => (edit = true)}>Edit Bill</Button>
				{/if}
			{/if}
		</SheetHeader>
		<form
			action={`?/${edit ? 'updateBill' : 'createBill'}`}
			method="post"
			use:enhance={enhanceForm}
		>
			{#if bill}
				<input type="hidden" name="id" value={bill.id} />
			{/if}
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
									<Select
										name="supplier_id"
										type="single"
										bind:value={selectedSupplierId}
										disabled={!!bill && !edit}
									>
										<SelectTrigger
											class={[
												'disabled:opacity-100',
												errors?.properties?.supplier_id ? 'border-red-500' : '',
												'w-full'
											]}
										>
											{selectedSupplier
												? selectedSupplier.name
												: bill?.supplier_name || 'Select supplier'}
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{#each suppliers as supplier (supplier.id)}
													<SelectItem value={supplier.id.toString()}>{supplier.name}</SelectItem>
												{/each}
											</SelectGroup>
										</SelectContent>
									</Select>
									{#if errors?.properties?.supplier_id}
										<small class="text-red-500">{errors.properties.supplier_id.errors[0]}</small>
									{/if}
								</div>
							</div>
							<div class="space-y-2">
								<Label>Linked PO</Label>
								<div>
									<Select
										name="purchase_order_id"
										type="single"
										bind:value={selectedPOId}
										disabled={!!bill && !edit}
									>
										<SelectTrigger
											class={[
												'disabled:opacity-100',
												errors?.properties?.purchase_order_id ? 'border-red-500' : '',
												'w-full'
											]}
										>
											{selectedPO ? selectedPO.reference : bill?.po_reference || 'Select PO'}
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
														<SelectItem value={po.id.toString()}>{po.reference}</SelectItem>
													{/each}
												</SelectGroup>
											{/if}
										</SelectContent>
									</Select>
									{#if errors?.properties?.purchase_order_id}
										<small class="text-red-500"
											>{errors.properties.purchase_order_id.errors[0]}</small
										>
									{/if}
								</div>
							</div>
							<div class="space-y-2">
								<Label>Bill Date</Label>
								<div>
									<DatePicker
										error={errors?.properties?.bill_date ? true : false}
										name="bill_date"
										bind:value={billDate}
									/>
									{#if errors?.properties?.bill_date}
										<small class="text-red-500">{errors.properties.bill_date.errors[0]}</small>
									{/if}
								</div>
							</div>
							<div class="space-y-2">
								<Label>Due Date</Label>
								<div>
									<DatePicker
										error={errors?.properties?.due_date ? true : false}
										name="due_date"
										bind:value={dueDate}
									/>
									{#if errors?.properties?.due_date}
										<small class="text-red-500">{errors.properties.due_date.errors[0]}</small>
									{/if}
								</div>
							</div>
							<div class="space-y-2">
								<Label>Notes</Label>
								<Textarea
									name="notes"
									placeholder="Add any notes about this bill..."
									bind:value={notes}
									disabled={!!bill && !edit}
									class="disabled:opacity-100"
								/>
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
								<div>
									<Select
										name="payment_type"
										type="single"
										bind:value={selectedPaymentMethod}
										disabled={!!bill && !edit}
									>
										<SelectTrigger
											class={[
												'disabled:opacity-100',
												errors?.properties?.payment_type ? 'border-red-500' : '',
												'w-full capitalize'
											]}
										>
											{selectedPaymentMethod || 'Select Payment Method'}
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="cash">Cash</SelectItem>
											<SelectItem value="check">Check</SelectItem>
										</SelectContent>
									</Select>
									{#if errors?.properties?.payment_type}
										<small class="text-red-500">{errors.properties.payment_type.errors[0]}</small>
									{/if}
								</div>
							</div>
							{#if selectedPaymentMethod === 'check'}
								<div class="space-y-2">
									<Label>Check Number</Label>
									<Input
										type="text"
										name="check_number"
										placeholder="Enter Check number"
										bind:value={checkNumber}
										disabled={!!bill && !edit}
										class="disabled:opacity-100"
									/>
								</div>
							{/if}
							<div class="space-y-2">
								<Label>Amount</Label>
								<div>
									<Input
										type="number"
										bind:value={paidAmount}
										name="paid_amount"
										class={[
											'disabled:opacity-100',
											errors?.properties?.paid_amount ? 'border-red-500' : ''
										]}
										max={selectedPO?.total ||
											(bill?.total_amount ? parseFloat(bill.total_amount) : undefined)}
										placeholder="Enter amount"
										disabled={!!bill && !edit}
									/>
									{#if errors?.properties?.paid_amount}
										<small class="text-red-500">{errors.properties.paid_amount.errors[0]}</small>
									{/if}
								</div>
								<input type="hidden" name="bill_status" value={billStatus} />
								<input
									type="hidden"
									name="total_amount"
									value={selectedPO?.total || bill?.total_amount}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
				{#if !bill || edit}
					<SheetFooter class="flex-row justify-end">
						<SheetClose type="button" class={buttonVariants({ variant: 'outline' })}>
							Cancel
						</SheetClose>
						<Button type="submit" variant="default">{edit ? 'Update Bill' : 'Add Bill'}</Button>
					</SheetFooter>
				{/if}
			</div>
		</form>
	</SheetContent>
</Sheet>
