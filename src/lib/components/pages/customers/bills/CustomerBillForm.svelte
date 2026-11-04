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
	import type { CustomerSO } from '$lib/types/global';
	import { Plus } from '@lucide/svelte';
	import type { ActionData } from '../../../../../routes/customers/bills/$types';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';

	interface Bill {
		id: number;
		sales_order_id: number;
		customer_name: string;
		invoice_date: Date;
		due_date: Date;
		notes: string | null;
		invoice_status: string | null;
		total_amount: string;
		paid_amount: string | null;
		items: {
			id: number;
			product_name: string | null;
			package_name: string | null;
			quantity: number;
			unit_price: string;
			total_price: string;
		}[];
		payments: {
			id: number;
			payment_date: Date;
			amount: string;
			payment_type: string;
			check_number: string | null;
			reference_number: string | null;
		}[];
	}

	interface Props {
		customers: { id: number; name: string }[];
		form?: ActionData;
		bill?: Bill | null;
		hasTrigger?: boolean;
		open?: boolean;
	}
	let {
		customers = [],
		form,
		bill = null,
		hasTrigger = true,
		open = $bindable(false)
	}: Props = $props();

	interface FormErrorTree {
		properties?: Record<string, { errors?: string[] }>;
	}
	let errors = $derived.by(() => {
		const formRecord = form as unknown as { error?: FormErrorTree } | undefined;
		return formRecord?.error;
	});
	const hasError = (name: string) => Boolean(errors?.properties?.[name]?.errors?.length);
	const fieldError = (name: string) => errors?.properties?.[name]?.errors?.[0] ?? '';

	// --- new bill: customer + linked SO + dates + optional first payment ---
	let selectedCustomerId = $state('');
	let customerSOs = $state<CustomerSO[]>([]);
	let selectedSOId = $state('');
	const DUE_OFFSET_MS = 30 * 24 * 60 * 60 * 1000;
	let invoiceDate = $state(new Date());
	let dueDate = $state(new Date(Date.now() + DUE_OFFSET_MS));
	let notes = $state('');
	let paidAmount = $state(0);
	let selectedPaymentMethod = $state('');
	let checkNumber = $state('');
	let referenceNumber = $state('');
	let selectedSO = $derived.by(() => customerSOs.find((so) => so.id === parseInt(selectedSOId)));
	const fullyBilled = (so: CustomerSO) =>
		!so.so_items.some((item) => item.quantity - item.invoiced_quantity > 0);
	let hasBillableItems = $derived.by(() => (selectedSO ? !fullyBilled(selectedSO) : false));
	let billableTotal = $derived.by(() => {
		if (!selectedSO) {
			return 0;
		}
		return selectedSO.so_items.reduce(
			(sum, item) => sum + Math.max(0, item.quantity - item.invoiced_quantity) * item.unit_price,
			0
		);
	});
	let selectedCustomerName = $derived.by(() => {
		const customer = customers.find((c) => c.id === parseInt(selectedCustomerId));
		return customer?.name || '';
	});
	let fetchSOByCustomer: HTMLFormElement;

	// --- record payment against an existing bill (invoice) ---
	let recordDate = $state(new Date());
	let recordAmount = $state(0);
	let recordPaymentMethod = $state('');
	let recordCheckNumber = $state('');
	let recordReferenceNumber = $state('');

	const enhanceForm: SubmitFunction = async () => {
		return async ({ result }) => {
			applyAction(result);

			if (result.type === 'success') {
				await invalidate('customers:bills');
				toast.success(bill ? 'Payment recorded successfully' : 'Bill created successfully');
				open = false;
			} else {
				toast.error(bill ? 'Failed to record payment' : 'Failed to create bill');
			}
		};
	};

	const handleFormClose = (status: boolean) => {
		if (!status) {
			goto(resolve('/customers/bills'));
		}
	};

	$effect(() => {
		if (selectedCustomerId && !bill) {
			customerSOs = [];
			selectedSOId = '';
			fetchSOByCustomer.requestSubmit();
		}

		if (!open) {
			selectedCustomerId = '';
			customerSOs = [];
			selectedSOId = '';
			invoiceDate = new Date();
			dueDate = new Date(Date.now() + DUE_OFFSET_MS);
			notes = '';
			paidAmount = 0;
			selectedPaymentMethod = '';
			checkNumber = '';
			referenceNumber = '';
			recordDate = new Date();
			recordAmount = 0;
			recordPaymentMethod = '';
			recordCheckNumber = '';
			recordReferenceNumber = '';

			if (form) {
				form = null;
			}
		}

		return;
	});
</script>

<form
	action="?/getCustomerRelatedSO"
	method="post"
	bind:this={fetchSOByCustomer}
	use:enhance={() => {
		return async ({ result }) => {
			if (result.type === 'success') {
				if (result.data) {
					customerSOs = result.data as unknown as CustomerSO[];
				}
			}
		};
	}}
>
	<input type="hidden" name="customer_id" value={selectedCustomerId} />
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
				<SheetTitle>{bill ? 'View Bill' : 'Add New Bill'}</SheetTitle>
				<SheetDescription>
					{bill
						? 'Review the bill and record a payment against it'
						: 'Fill in the details to bill a sales order to a customer'}
				</SheetDescription>
			</div>
		</SheetHeader>

		{#if bill}
			<form action="?/recordPayment" method="post" use:enhance={enhanceForm}>
				<input type="hidden" name="invoice_id" value={bill.id} />
				<div class="flex flex-col gap-6 px-6">
					<Card>
						<CardHeader>
							<CardTitle>Bill Details</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="flex flex-col gap-4">
								<div class="space-y-1">
									<Label class="text-muted-foreground">Customer</Label>
									<p>{bill.customer_name}</p>
								</div>
								<div class="space-y-1">
									<Label class="text-muted-foreground">Sales Order</Label>
									<p>SO-{bill.sales_order_id}</p>
								</div>
								<div class="space-y-1">
									<Label class="text-muted-foreground">Invoice Date</Label>
									<p>
										{bill.invoice_date.toLocaleDateString('en-US', {
											day: 'numeric',
											month: 'long',
											year: 'numeric'
										})}
									</p>
								</div>
								<div class="space-y-1">
									<Label class="text-muted-foreground">Due Date</Label>
									<p>
										{bill.due_date.toLocaleDateString('en-US', {
											day: 'numeric',
											month: 'long',
											year: 'numeric'
										})}
									</p>
								</div>
								{#if bill.notes}
									<div class="space-y-1">
										<Label class="text-muted-foreground">Notes</Label>
										<p>{bill.notes}</p>
									</div>
								{/if}
								<div class="flex items-center justify-between border-t pt-3">
									<span class="text-sm font-semibold">Total</span>
									<span class="text-sm">₱{parseFloat(bill.total_amount).toFixed(2)}</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-sm text-muted-foreground">Paid</span>
									<span class="text-sm">₱{parseFloat(bill.paid_amount || '0').toFixed(2)}</span>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Items</CardTitle>
						</CardHeader>
						<CardContent class="!px-0">
							<Table class="mt-4">
								<TableHeader>
									<TableRow>
										<TableHead class="!text-sm font-medium text-primary">Product</TableHead>
										<TableHead class="!text-sm font-medium text-primary">Quantity</TableHead>
										<TableHead class="text-end !text-sm font-medium text-primary">
											Unit Price
										</TableHead>
										<TableHead class="text-end !text-sm font-medium text-primary">Total</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{#each bill.items as item, ndx (ndx)}
										<TableRow class="last:!border-b">
											<TableCell>{item.package_name || item.product_name || '—'}</TableCell>
											<TableCell>{item.quantity}</TableCell>
											<TableCell class="text-end"
												>{parseFloat(item.unit_price).toFixed(2)}</TableCell
											>
											<TableCell class="text-end">
												{parseFloat(item.total_price).toFixed(2)}
											</TableCell>
										</TableRow>
									{:else}
										<TableRow>
											<TableCell colspan={4} class="text-center">No items found</TableCell>
										</TableRow>
									{/each}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
					{#if bill.payments.length}
						<Card>
							<CardHeader>
								<CardTitle>Payments</CardTitle>
							</CardHeader>
							<CardContent class="!px-0">
								<Table class="mt-4">
									<TableHeader>
										<TableRow>
											<TableHead class="!text-sm font-medium text-primary">Date</TableHead>
											<TableHead class="!text-sm font-medium text-primary">Method</TableHead>
											<TableHead class="text-end !text-sm font-medium text-primary">
												Amount
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{#each bill.payments as payment, ndx (ndx)}
											<TableRow class="last:!border-b">
												<TableCell>
													{payment.payment_date.toLocaleDateString('en-US', {
														day: 'numeric',
														month: 'short',
														year: 'numeric'
													})}
												</TableCell>
												<TableCell class="capitalize">
													{payment.payment_type}
													{#if payment.check_number}
														(#{payment.check_number})
													{:else if payment.reference_number}
														(#{payment.reference_number})
													{/if}
												</TableCell>
												<TableCell class="text-end">
													₱{parseFloat(payment.amount).toFixed(2)}
												</TableCell>
											</TableRow>
										{/each}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					{/if}
					<Card>
						<CardHeader>
							<CardTitle>Record Payment</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="flex flex-col gap-6">
								<div class="space-y-2">
									<Label>Payment Date</Label>
									<div>
										<DatePicker
											error={hasError('payment_date')}
											name="payment_date"
											bind:value={recordDate}
										/>
										{#if hasError('payment_date')}
											<small class="text-red-500">{fieldError('payment_date')}</small>
										{/if}
									</div>
								</div>
								<div class="space-y-2">
									<Label>Payment Method</Label>
									<div>
										<Select name="payment_type" type="single" bind:value={recordPaymentMethod}>
											<SelectTrigger
												class={[
													'w-full capitalize',
													hasError('payment_type') ? 'border-red-500' : ''
												]}
											>
												{recordPaymentMethod ? recordPaymentMethod : 'Select Payment Method'}
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													<SelectItem value="cash">Cash</SelectItem>
													<SelectItem value="check">Check</SelectItem>
													<SelectItem value="bank_transfer">Bank Transfer</SelectItem>
												</SelectGroup>
											</SelectContent>
										</Select>
										{#if hasError('payment_type')}
											<small class="text-red-500">{fieldError('payment_type')}</small>
										{/if}
									</div>
								</div>
								{#if recordPaymentMethod === 'check'}
									<div class="space-y-2">
										<Label>Check Number</Label>
										<Input
											type="text"
											name="check_number"
											placeholder="Enter check number"
											bind:value={recordCheckNumber}
											class={hasError('check_number') ? 'border-red-500' : ''}
										/>
										{#if hasError('check_number')}
											<small class="text-red-500">{fieldError('check_number')}</small>
										{/if}
									</div>
								{/if}
								{#if recordPaymentMethod === 'bank_transfer'}
									<div class="space-y-2">
										<Label>Reference Number</Label>
										<Input
											type="text"
											name="reference_number"
											placeholder="Enter reference number"
											bind:value={recordReferenceNumber}
										/>
									</div>
								{/if}
								<div class="space-y-2">
									<Label>Amount</Label>
									<div>
										<Input
											type="number"
											name="amount"
											bind:value={recordAmount}
											class={hasError('amount') ? 'border-red-500' : ''}
											max={Math.max(
												0,
												parseFloat(bill.total_amount) - parseFloat(bill.paid_amount || '0')
											)}
											placeholder="Enter amount"
										/>
										{#if hasError('amount')}
											<small class="text-red-500">{fieldError('amount')}</small>
										{/if}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
					<SheetFooter class="flex-row justify-end">
						<SheetClose type="button" class={buttonVariants({ variant: 'outline' })}>
							Cancel
						</SheetClose>
						<Button type="submit" variant="default">Record Payment</Button>
					</SheetFooter>
				</div>
			</form>
		{:else}
			<form action="?/createBill" method="post" use:enhance={enhanceForm}>
				<div class="flex flex-col gap-6 px-6">
					<Card>
						<CardHeader>
							<CardTitle>Bill Details</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="flex flex-col gap-6">
								<div class="space-y-2">
									<Label>Customer</Label>
									<div>
										<Select type="single" bind:value={selectedCustomerId}>
											<SelectTrigger class="w-full">
												{selectedCustomerName || 'Select customer'}
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{#each customers as customer (customer.id)}
														<SelectItem value={customer.id.toString()}>
															{customer.name}
														</SelectItem>
													{/each}
												</SelectGroup>
											</SelectContent>
										</Select>
									</div>
								</div>
								<div class="space-y-2">
									<Label>Linked SO</Label>
									<div>
										<Select
											name="sales_order_id"
											type="single"
											bind:value={selectedSOId}
											disabled={!selectedCustomerId}
										>
											<SelectTrigger
												class={[
													'w-full disabled:opacity-100',
													hasError('sales_order_id') ? 'border-red-500' : ''
												]}
											>
												{selectedSO
													? `SO-${selectedSO.id} · ₱${selectedSO.total_cost.toFixed(2)}`
													: 'Select SO'}
											</SelectTrigger>
											<SelectContent>
												{#if customerSOs.length === 0 && !selectedCustomerId}
													<SelectGroup>
														<SelectItem value="" disabled>No customer selected</SelectItem>
													</SelectGroup>
												{:else if customerSOs.length === 0 && selectedCustomerId}
													<SelectGroup>
														<SelectItem value="" disabled>No sales orders found</SelectItem>
													</SelectGroup>
												{:else}
													<SelectGroup>
														{#each customerSOs as so, ndx (ndx)}
															<SelectItem value={so.id.toString()}>
																SO-{so.id} ·
																{so.date_ordered.toLocaleDateString('en-US', {
																	day: 'numeric',
																	month: 'short',
																	year: 'numeric'
																})}
																{fullyBilled(so) && '· billed'}
															</SelectItem>
														{/each}
													</SelectGroup>
												{/if}
											</SelectContent>
										</Select>
										{#if hasError('sales_order_id')}
											<small class="text-red-500">{fieldError('sales_order_id')}</small>
										{/if}
									</div>
								</div>
								<div class="space-y-2">
									<Label>Invoice Date</Label>
									<div>
										<DatePicker
											error={hasError('invoice_date')}
											name="invoice_date"
											bind:value={invoiceDate}
										/>
										{#if hasError('invoice_date')}
											<small class="text-red-500">{fieldError('invoice_date')}</small>
										{/if}
									</div>
								</div>
								<div class="space-y-2">
									<Label>Due Date</Label>
									<div>
										<DatePicker error={hasError('due_date')} name="due_date" bind:value={dueDate} />
										{#if hasError('due_date')}
											<small class="text-red-500">{fieldError('due_date')}</small>
										{/if}
									</div>
								</div>
								<div class="space-y-2">
									<Label>Notes</Label>
									<Textarea
										name="notes"
										placeholder="Add any notes about this bill..."
										bind:value={notes}
									/>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Items</CardTitle>
						</CardHeader>
						<CardContent class="!px-0">
							<Table class="mt-4">
								<TableHeader>
									<TableRow>
										<TableHead class="!text-sm font-medium text-primary">Product</TableHead>
										<TableHead class="!text-sm font-medium text-primary">Quantity</TableHead>
										<TableHead class="text-end !text-sm font-medium text-primary">
											Unit Price
										</TableHead>
										<TableHead class="text-end !text-sm font-medium text-primary">Total</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{#if hasBillableItems && selectedSO}
										{#each selectedSO.so_items as item, ndx (ndx)}
											{#if item.quantity - item.invoiced_quantity > 0}
												<TableRow class="last:!border-b">
													<TableCell>{item.name}</TableCell>
													<TableCell>{item.quantity - item.invoiced_quantity}</TableCell>
													<TableCell class="text-end">{item.unit_price.toFixed(2)}</TableCell>
													<TableCell class="text-end">
														{((item.quantity - item.invoiced_quantity) * item.unit_price).toFixed(
															2
														)}
													</TableCell>
												</TableRow>
											{/if}
										{/each}
									{:else if selectedSO}
										<TableRow>
											<TableCell colspan={4} class="text-center">
												This sales order is fully billed — nothing left to invoice
											</TableCell>
										</TableRow>
									{:else}
										<TableRow>
											<TableCell colspan={4} class="text-center">
												No billable items — select a sales order
											</TableCell>
										</TableRow>
									{/if}
								</TableBody>
							</Table>
							{#if selectedSO}
								<div class="mt-4 ml-auto w-1/2 space-y-3">
									<div class="flex items-center justify-between">
										<span class="text-sm text-muted-foreground">Billable Total</span>
										<span class="text-sm">₱{billableTotal.toFixed(2)}</span>
									</div>
									<div class="flex items-center justify-between">
										<span class="text-sm text-muted-foreground">SO Total</span>
										<span class="text-sm">₱{selectedSO.total_cost.toFixed(2)}</span>
									</div>
								</div>
							{/if}
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Payment Details</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="flex flex-col gap-6">
								<div class="space-y-2">
									<Label class="text-muted-foreground"
										>Payment is optional — the bill can be paid later.</Label
									>
								</div>
								{#if paidAmount > 0}
									<div class="space-y-2">
										<Label>Payment Method</Label>
										<div>
											<Select name="payment_type" type="single" bind:value={selectedPaymentMethod}>
												<SelectTrigger
													class={[
														'w-full capitalize',
														errors?.properties?.payment_type ? 'border-red-500' : ''
													]}
												>
													{selectedPaymentMethod || 'Select Payment Method'}
												</SelectTrigger>
												<SelectContent>
													<SelectGroup>
														<SelectItem value="cash">Cash</SelectItem>
														<SelectItem value="check">Check</SelectItem>
														<SelectItem value="bank_transfer">Bank Transfer</SelectItem>
													</SelectGroup>
												</SelectContent>
											</Select>
											{#if hasError('payment_type')}
												<small class="text-red-500">{fieldError('payment_type')}</small>
											{/if}
										</div>
									</div>
									{#if selectedPaymentMethod === 'check'}
										<div class="space-y-2">
											<Label>Check Number</Label>
											<Input
												type="text"
												name="check_number"
												placeholder="Enter check number"
												bind:value={checkNumber}
												class={hasError('check_number') ? 'border-red-500' : ''}
											/>
											{#if hasError('check_number')}
												<small class="text-red-500">{fieldError('check_number')}</small>
											{/if}
										</div>
									{/if}
									{#if selectedPaymentMethod === 'bank_transfer'}
										<div class="space-y-2">
											<Label>Reference Number</Label>
											<Input
												type="text"
												name="reference_number"
												placeholder="Enter reference number"
												bind:value={referenceNumber}
											/>
										</div>
									{/if}
								{/if}
								<div class="space-y-2">
									<Label>Amount</Label>
									<div>
										<Input
											type="number"
											name="paid_amount"
											bind:value={paidAmount}
											class={hasError('paid_amount') ? 'border-red-500' : ''}
											max={billableTotal || undefined}
											placeholder="Enter amount paid (leave 0 to pay later)"
										/>
										{#if hasError('paid_amount')}
											<small class="text-red-500">{fieldError('paid_amount')}</small>
										{/if}
									</div>
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
		{/if}
	</SheetContent>
</Sheet>
