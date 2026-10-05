<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import Label from '$lib/components/ui/label/label.svelte';
	import type { DailySalesItem } from '$lib/types/global';
	import { formatCurrency } from '$lib/utils/common';
	import { InvoicePaymentType, SalesChannel } from '$lib/const';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	let { items = $bindable<DailySalesItem[]>(), customerId = $bindable() } = $props();
	let staffUserId = $derived(page.data.auth_user.id);
	let dateOrdered = $state(new Date());

	let subtotal = $derived.by(() => {
		return items.reduce((acc: number, item: DailySalesItem) => acc + item.total_cost, 0);
	});

	// This part is to be added. Depending on client request.
	let discount = $state(0);

	let total = $derived.by(() => {
		return subtotal - discount;
	});

	let amountReceived = $state(0);
	let change = $derived.by(() => {
		return amountReceived ? total - amountReceived : 0;
	});

	let enhanceForm: SubmitFunction = () => {
		return async ({ result }) => {
			await applyAction(result);
			if (result.type === 'success') {
				await invalidateAll();
				toast.success('Daily sales added successfully');
			} else {
				toast.error('Failed to add daily sales');
			}
		};
	};

	const onCancel = () => {
		items = [];
	};
</script>

<Card>
	<CardContent class="w-[280px]">
		<p class="font-medium">Summary</p>
		<div class="mt-2 flex flex-col gap-2">
			<div class="flex items-center justify-between">
				<p class="text-sm text-muted-foreground">Subtotal:</p>
				<p class="text-sm font-medium">{formatCurrency(subtotal)}</p>
			</div>
			<div class="flex flex-col">
				<p class="text-sm text-muted-foreground text-left w-full">Discount:</p>
				<Input type="number" placeholder="0.00" bind:value={discount} class="text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
			</div>
		</div>
		<hr class="my-2" />
		<div class="flex items-center justify-between">
			<p class="text-sm font-medium">Total:</p>
			<p class="text-sm font-medium">{formatCurrency(total)}</p>
		</div>

		<div class="mt-4 flex flex-col gap-2">
			<Label>Amount Received:</Label>
			<Input type="number" placeholder="0.00" bind:value={amountReceived} />
		</div>

		<div class="mt-4 flex flex-col gap-2">
			<Label>Change:</Label>
			<Input type="number" placeholder="0.00" readonly value={change} />
		</div>

		<div class="mt-4 flex flex-col gap-2">
			<form
				method="post"
				action="/customers/daily-sales?/createDailySales"
				use:enhance={enhanceForm}
			>
				<input type="hidden" name="customer_id" value={customerId} />
				<input type="hidden" name="total_cost" value={total} />
				<input type="hidden" name="order_type" value="onetime" />
				<input type="hidden" name="sales_channel" value={SalesChannel.POS} />
				<input type="hidden" name="staff_user_id" value={staffUserId} />
				<input type="hidden" name="date_ordered" value={dateOrdered} />
				<input type="hidden" name="notes" value="" />
				<input type="hidden" name="payment_amount" value={amountReceived} />
				<input type="hidden" name="payment_type" value={InvoicePaymentType.CASH} />
				{#each items as item, i (item.product_id)}
					{#if item.serial_numbers.length}
						{#each item.serial_numbers as serialNumber, index (serialNumber)}
							<input type="hidden" name={`products.${(items.length - 1) + index}.product_id`} value={item.product_id} />
							<input type="hidden" name={`products.${(items.length - 1) + index}.package_id`} value={item.package_id} />
							<input type="hidden" name={`products.${(items.length - 1) + index}.quantity`} value={1} />
							<input type="hidden" name={`products.${(items.length - 1) + index}.total_price`} value={item.sale_price} />
							<input type="hidden" name={`products.${(items.length - 1) + index}.unit_price`} value={item.sale_price} />
							<input type="hidden" name={`products.${(items.length - 1) + index}.serial_number`} value={serialNumber} />
						{/each}
					{:else}
						<input type="hidden" name={`products.${i}.product_id`} value={item.product_id} />
						<input type="hidden" name={`products.${i}.package_id`} value={item.package_id} />
						<input type="hidden" name={`products.${i}.quantity`} value={item.quantity} />
						<input type="hidden" name={`products.${i}.total_price`} value={item.total_cost} />
						<input type="hidden" name={`products.${i}.unit_price`} value={item.sale_price} />
					{/if}
				{/each}
				<Button type="submit" class="w-full" disabled={items.length === 0}>Save Sale</Button>
			</form>
			<div class="flex gap-2 [&>button]:flex-1">
				<Button
					variant="outline"
					class="border-red-500 text-red-500 hover:text-red-500"
					onclick={onCancel}
				>
					Discard
				</Button>
			</div>
		</div>
	</CardContent>
</Card>
