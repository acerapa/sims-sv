<script lang="ts">
	import { page } from '$app/state';
	import PrintReportLayout from '$lib/components/common/PrintReportLayout.svelte';
	import { capitalizeFirstLetter, formatCurrency } from '$lib/utils/common';
	import { openAndPrint, formatDatePdf } from '$lib/utils/pdf';
	import { buildBillPdf, type BillPrintData } from './pdf';

	const bill = $derived(page.data?.bill as BillPrintData | undefined);

	const toNum = (value: string | number) => {
		const parsed = parseFloat(String(value ?? '0')) || 0;
		return Number.isFinite(parsed) ? parsed : 0;
	};

	const balance = $derived(bill ? Math.max(0, toNum(bill.total) - toNum(bill.paid_amount)) : 0);

	const paymentLabel = $derived(
		bill
			? capitalizeFirstLetter(bill.payment_type) === 'Check' && bill.check_number
				? `Check (No. ${bill.check_number})`
				: capitalizeFirstLetter(bill.payment_type || '') || '—'
			: '—'
	);

	const billNumber = (id: number) => `BILL-00${id}`;

	async function handlePrint() {
		if (!bill) return;
		openAndPrint(await buildBillPdf(bill));
	}
</script>

<PrintReportLayout
	reportTitle={`Bill — ${bill ? billNumber(bill.id) : ''} · ${bill ? capitalizeFirstLetter(bill.bill_status) : ''}`}
	onPrint={handlePrint}
>
	{#if bill}
		<section class="flex flex-col gap-3">
			<div class="flex gap-5">
				<div class="flex-1 border-b border-muted-foreground py-1">
					<p class="text-xs font-bold text-muted-foreground">SUPPLIER</p>
					<p>{bill.supplier_name || '—'}</p>
				</div>
				<div class="flex-1 border-b border-muted-foreground py-1">
					<p class="text-xs font-bold text-muted-foreground">LINKED PO</p>
					<p>{bill.po_reference || '—'}</p>
				</div>
			</div>
			<div class="flex gap-5">
				<div class="flex-1 border-b border-muted-foreground py-1">
					<p class="text-xs font-bold text-muted-foreground">BILL DATE</p>
					<p>{formatDatePdf(bill.bill_date)}</p>
				</div>
				<div class="flex-1 border-b border-muted-foreground py-1">
					<p class="text-xs font-bold text-muted-foreground">DUE DATE</p>
					<p>{formatDatePdf(bill.due_date)}</p>
				</div>
			</div>
			<div class="flex gap-5">
				<div class="w-[calc(50%_-_10px)] border-b border-muted-foreground py-1">
					<p class="text-xs font-bold text-muted-foreground">PAYMENT</p>
					<p>{paymentLabel}</p>
				</div>
			</div>
			<div class="flex-1 py-1">
				<p class="text-xs font-bold text-muted-foreground">NOTES</p>
				<div class="min-h-12 rounded border border-muted-foreground p-2">
					{bill.notes ? bill.notes : '---'}
				</div>
			</div>

			<p class="mt-4 font-bold">Items</p>
			<hr class="border-muted-foreground" />
			<table class="print-table">
				<thead>
					<tr>
						<th>Product</th>
						<th class="text-right">Qty</th>
						<th class="text-right">Unit Cost</th>
						<th class="text-right">Total</th>
					</tr>
				</thead>
				<tbody>
					{#if bill.po_items.length === 0}
						<tr>
							<td colspan="4" style="text-align: center; color: #666;">
								No items on this purchase order.
							</td>
						</tr>
					{:else}
						{#each bill.po_items as item (item.name + String(item.quantity))}
							<tr>
								<td>{item.name}</td>
								<td class="text-right">{item.quantity}</td>
								<td class="text-right">{formatCurrency(item.cost)}</td>
								<td class="text-right">{formatCurrency(item.total_cost)}</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>

			<div class="ml-auto w-1/2 space-y-3">
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Subtotal</span>
					<span class="text-sm">{formatCurrency(bill.sub_total)}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Discount</span>
					<span class="text-sm">{formatCurrency(bill.discount)}</span>
				</div>
				<div class="flex items-center justify-between border-b">
					<span class="text-sm font-semibold">Total</span>
					<span class="text-sm">{formatCurrency(bill.total)}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Amount Paid</span>
					<span class="text-sm">{formatCurrency(bill.paid_amount)}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm font-semibold">Balance</span>
					<span class="text-sm">{formatCurrency(balance)}</span>
				</div>
			</div>
		</section>
	{:else}
		<p class="text-center text-muted-foreground">Bill not found.</p>
	{/if}
</PrintReportLayout>
