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
	import { invalidate } from '$app/navigation';

	interface Props {
		suppliers: Supplier[];
		form?: ActionData;
	}
	let { suppliers = [], form }: Props = $props();

	let open = $state(false);
	let errors = $derived(form?.error);
	let selectedSupplierId = $state('');
	let fetchPOBySupplier: HTMLFormElement;
	let selectedSupplier = $derived.by(() => {
		return suppliers.find((supplier) => supplier.id === parseInt(selectedSupplierId));
	});
	let selectedPOId = $state('');
	let supplierPOs = $state<SupplierPO[]>([]);
	let selectedPO = $derived.by(() => {
		return supplierPOs.find((po) => po.id === parseInt(selectedPOId));
	});
	let selectedPaymentMethod = $state('');
	let paidAmount = $state(0);
	let billStatus = $derived.by(() => {
		if (!selectedPO && !paidAmount) return '';

		return selectedPO?.total == paidAmount ? 'paid' : 'partial';
	});

	const enhanceForm: SubmitFunction = async () => {
		return async ({ result }) => {
			applyAction(result);

			if (result.type === 'success') {
				await invalidate('vendors:bills');
				toast.success('Bill created successfully');
				open = false;

				// clear all saved states exclude the deriveds
				selectedSupplierId = '';
				selectedPOId = '';
				supplierPOs = [];
				selectedPaymentMethod = '';
				paidAmount = 0;
			} else {
				toast.error('Failed to create bill');
			}
		};
	};

	$effect(() => {
		if (selectedSupplierId) {
			supplierPOs = [];
			fetchPOBySupplier.requestSubmit();
		}

		if (!open) {
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
		<form action="?/createBill" method="post" use:enhance={enhanceForm}>
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
									<Select name="supplier_id" type="single" bind:value={selectedSupplierId}>
										<SelectTrigger
											class={[errors?.properties?.supplier_id ? 'border-red-500' : '', 'w-full']}
										>
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
									{#if errors?.properties?.supplier_id}
										<small class="text-red-500">{errors.properties.supplier_id.errors[0]}</small>
									{/if}
								</div>
							</div>
							<div class="space-y-2">
								<Label>Linked PO</Label>
								<div>
									<Select name="purchase_order_id" type="single" bind:value={selectedPOId}>
										<SelectTrigger
											class={[
												errors?.properties?.purchase_order_id ? 'border-red-500' : '',
												'w-full'
											]}
										>
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
									/>
									{#if errors?.properties?.bill_date}
										<small class="text-red-500">{errors.properties.bill_date.errors[0]}</small>
									{/if}
								</div>
							</div>
							<div class="space-y-2">
								<Label>Due Date</Label>
								<div>
									<DatePicker error={errors?.properties?.due_date ? true : false} name="due_date" />
									{#if errors?.properties?.due_date}
										<small class="text-red-500">{errors.properties.due_date.errors[0]}</small>
									{/if}
								</div>
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
								<div>
									<Select name="payment_type" type="single" bind:value={selectedPaymentMethod}>
										<SelectTrigger
											class={[
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
									<Input type="text" name="check_number" placeholder="Enter Check number" />
								</div>
							{/if}
							<div class="space-y-2">
								<Label>Amount</Label>
								<div>
									<Input
										type="number"
										bind:value={paidAmount}
										name="paid_amount"
										class={errors?.properties?.paid_amount ? 'border-red-500' : ''}
										max={selectedPO?.total}
										placeholder="Enter amount"
									/>
									{#if errors?.properties?.paid_amount}
										<small class="text-red-500">{errors.properties.paid_amount.errors[0]}</small>
									{/if}
								</div>
								<input type="hidden" name="bill_status" value={billStatus} />
								<input type="hidden" name="total_amount" value={selectedPO?.total} />
							</div>
						</div>
					</CardContent>
				</Card>
				<SheetFooter class="flex-row justify-end">
					<SheetClose type="button" class={buttonVariants({ variant: 'outline' })}>
						Cancel
					</SheetClose>
					<Button type="submit" variant="default">Add Bill</Button>
				</SheetFooter>
			</div>
		</form>
	</SheetContent>
</Sheet>
