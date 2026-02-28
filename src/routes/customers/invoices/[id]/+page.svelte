<script lang="ts">
	import DatePicker from '$lib/components/common/DatePicker.svelte';
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
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
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
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { PageProps } from './$types';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';

	let { data, form }: PageProps = $props();

	let errors = $derived((form as any)?.errors);
	let invoice = $derived(data.invoice);

	let balance = $derived(
		parseFloat(invoice.total_amount as string) - parseFloat(invoice.paid_amount as string)
	);

	let paymentDialogOpen = $state(false);
	let selectedPaymentType = $state<string>('');
	let selectedPaymentTypeLabel = $derived.by(() => {
		switch (selectedPaymentType) {
			case 'cash':
				return 'Cash';
			case 'check':
				return 'Check';
			case 'bank_transfer':
				return 'Bank Transfer';
			default:
				return null;
		}
	});

	const getStatusVariant = (status: string) => {
		switch (status) {
			case 'unpaid':
				return 'default';
			case 'partially_paid':
				return 'outline';
			case 'paid':
				return 'secondary';
			case 'cancelled':
				return 'destructive';
			default:
				return 'outline';
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'unpaid':
				return 'Unpaid';
			case 'partially_paid':
				return 'Partially Paid';
			case 'paid':
				return 'Paid';
			case 'cancelled':
				return 'Cancelled';
			default:
				return status;
		}
	};

	const submitPayment: SubmitFunction = async () => {
		return async ({ result }) => {
			if (result.type === 'success') {
				toast.success('Payment recorded successfully');
				paymentDialogOpen = false;
				selectedPaymentType = '';
				await invalidateAll();
			} else {
				await applyAction(result);
				toast.error('Failed to record payment');
			}
		};
	};
</script>

<svelte:head>
	<title>RamTech | Invoice INV-{invoice.id}</title>
	<meta name="description" content="Invoice details" />
</svelte:head>

<div class="flex flex-col gap-6">
	<!-- Invoice Header -->
	<Card class="rounded-lg">
		<CardHeader class="flex items-center justify-between">
			<div class="space-y-1">
				<CardTitle class="text-lg">Invoice INV-{invoice.id}</CardTitle>
				<CardDescription>Sales Order SO-{invoice.sales_order_id}</CardDescription>
			</div>
			<div class="flex items-center gap-3">
				<Badge variant={getStatusVariant(invoice.invoice_status || 'unpaid')}>
					{getStatusLabel(invoice.invoice_status || 'unpaid')}
				</Badge>
				{#if invoice.invoice_status !== 'paid' && invoice.invoice_status !== 'cancelled'}
					<Dialog bind:open={paymentDialogOpen}>
						<DialogTrigger>
							{#snippet child({ props })}
								<Button {...props}>Receive Payment</Button>
							{/snippet}
						</DialogTrigger>
						<DialogContent class="sm:max-w-lg">
							<form method="post" action="?/receivePayment" use:enhance={submitPayment}>
								<input type="hidden" name="invoice_id" value={invoice.id} />
								<DialogHeader>
									<DialogTitle>Receive Payment</DialogTitle>
									<DialogDescription>
										Record a payment for Invoice INV-{invoice.id}. Balance: ₱{balance.toFixed(2)}
									</DialogDescription>
								</DialogHeader>
								<div class="flex flex-col gap-4 py-4">
									<div class="flex flex-col gap-2">
										<Label>Payment Date</Label>
										<DatePicker
											error={errors?.properties?.payment_date ? true : false}
											name="payment_date"
										/>
										{#if errors?.properties?.payment_date}
											<small class="text-red-500">
												{errors.properties.payment_date.errors[0]}
											</small>
										{/if}
									</div>
									<div class="flex flex-col gap-2">
										<Label>Amount (₱)</Label>
										<Input
											type="number"
											name="amount"
											step="0.01"
											max={balance}
											placeholder="0.00"
											class={errors?.properties?.amount ? 'border-red-500' : ''}
										/>
										{#if errors?.properties?.amount}
											<small class="text-red-500">
												{errors.properties.amount.errors[0]}
											</small>
										{/if}
									</div>
									<div class="flex flex-col gap-2">
										<Label>Payment Type</Label>
										<Select type="single" name="payment_type" bind:value={selectedPaymentType}>
											<SelectTrigger
												class={[
													'h-10 w-full',
													errors?.properties?.payment_type ? 'border-red-500' : ''
												]}
											>
												{selectedPaymentTypeLabel ? selectedPaymentTypeLabel : 'Select Payment Type'}
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													<SelectItem value="cash">Cash</SelectItem>
													<SelectItem value="check">Check</SelectItem>
													<SelectItem value="bank_transfer">Bank Transfer</SelectItem>
												</SelectGroup>
											</SelectContent>
										</Select>
										{#if errors?.properties?.payment_type}
											<small class="text-red-500">
												{errors.properties.payment_type.errors[0]}
											</small>
										{/if}
									</div>
									{#if selectedPaymentType === 'check'}
										<div class="flex flex-col gap-2">
											<Label>Check Number</Label>
											<Input
												name="check_number"
												placeholder="Enter check number"
												class={errors?.properties?.check_number ? 'border-red-500' : ''}
											/>
											{#if errors?.properties?.check_number}
												<small class="text-red-500">
													{errors.properties.check_number.errors[0]}
												</small>
											{/if}
										</div>
									{/if}
									{#if selectedPaymentType === 'bank_transfer'}
										<div class="flex flex-col gap-2">
											<Label>Reference Number</Label>
											<Input
												name="reference_number"
												placeholder="Enter reference number"
											/>
										</div>
									{/if}
									<div class="flex flex-col gap-2">
										<Label>Notes</Label>
										<Textarea
											name="notes"
											class="h-10"
											placeholder="Payment notes..."
										/>
									</div>
								</div>
								<DialogFooter>
									<Button type="submit">Record Payment</Button>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
				{/if}
			</div>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-2 gap-6 md:grid-cols-4">
				<div>
					<p class="text-sm text-muted-foreground">Customer</p>
					<p class="font-medium">{invoice.customer_name}</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">Invoice Date</p>
					<p class="font-medium">
						{new Date(invoice.invoice_date).toLocaleDateString('default', {
							day: 'numeric',
							month: 'short',
							year: 'numeric'
						})}
					</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">Due Date</p>
					<p class="font-medium">
						{new Date(invoice.due_date).toLocaleDateString('default', {
							day: 'numeric',
							month: 'short',
							year: 'numeric'
						})}
					</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">Notes</p>
					<p class="font-medium">{invoice.notes || '—'}</p>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Invoice Items -->
	<Card class="rounded-lg">
		<CardHeader>
			<CardTitle>Invoice Items</CardTitle>
		</CardHeader>
		<CardContent>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Product</TableHead>
						<TableHead>Quantity</TableHead>
						<TableHead>Unit Price (₱)</TableHead>
						<TableHead>Total (₱)</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each invoice.items as item (item.id)}
						<TableRow>
							<TableCell>{item.product_name}</TableCell>
							<TableCell>{item.quantity}</TableCell>
							<TableCell>₱{parseFloat(item.unit_price as string).toFixed(2)}</TableCell>
							<TableCell class="font-medium">
								₱{parseFloat(item.total_price as string).toFixed(2)}
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>

			<div class="mt-4 w-1/2 space-y-2 self-end ml-auto">
				<div class="flex items-center justify-between">
					<span>Total:</span>
					<span class="font-bold">₱{parseFloat(invoice.total_amount as string).toFixed(2)}</span>
				</div>
				<div class="flex items-center justify-between">
					<span>Paid:</span>
					<span>₱{parseFloat(invoice.paid_amount as string).toFixed(2)}</span>
				</div>
				<div class="flex items-center justify-between border-t pt-2">
					<span class="font-bold">Balance:</span>
					<span class="font-bold">₱{balance.toFixed(2)}</span>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Payment History -->
	<Card class="rounded-lg">
		<CardHeader>
			<CardTitle>Payment History</CardTitle>
		</CardHeader>
		<CardContent>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Payment #</TableHead>
						<TableHead>Date</TableHead>
						<TableHead>Type</TableHead>
						<TableHead>Reference</TableHead>
						<TableHead>Notes</TableHead>
						<TableHead>Amount (₱)</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each invoice.payments as payment (payment.id)}
						<TableRow>
							<TableCell class="font-medium">PAY-{payment.id}</TableCell>
							<TableCell>
								{new Date(payment.payment_date).toLocaleDateString('default', {
									day: 'numeric',
									month: 'short',
									year: 'numeric'
								})}
							</TableCell>
							<TableCell class="capitalize">{payment.payment_type?.replace('_', ' ')}</TableCell>
							<TableCell>{payment.check_number || payment.reference_number || '—'}</TableCell>
							<TableCell>{payment.notes || '—'}</TableCell>
							<TableCell class="font-medium">
								₱{parseFloat(payment.amount as string).toFixed(2)}
							</TableCell>
						</TableRow>
					{/each}
					{#if invoice.payments.length === 0}
						<TableRow>
							<TableCell colspan={6} class="text-center text-muted-foreground">
								No payments recorded yet
							</TableCell>
						</TableRow>
					{/if}
				</TableBody>
			</Table>
		</CardContent>
	</Card>

	<div class="flex gap-3 self-start">
		<Button variant="outline" href="/customers/invoices">Back to Invoices</Button>
	</div>
</div>
