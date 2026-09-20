<script lang="ts">
	import { enhance } from "$app/forms";
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent } from "$lib/components/ui/card";
	import { Input } from "$lib/components/ui/input";
	import Label from "$lib/components/ui/label/label.svelte";
	import type { DailySalesItem } from "$lib/types/global";
	import { formatCurrency } from "$lib/utils/common";
	import { SalesChannel } from "$lib/const";

	let { items = $bindable<DailySalesItem[]>() } = $props();
	let walkInCustomerId = $derived(page.data.walkInCustomerId);
	let staffUserId = $derived(page.data.auth_user.id);
	let dateOrdered = $state(new Date());

	let subtotal = $derived.by(() => {
		return items.reduce((acc: number, item: DailySalesItem) => acc + item.total_cost, 0);
	})

	// This part is to be added. Depending on client request.
	let discount = 0;

	let total = $derived.by(() => {
		return subtotal - discount;
	})

	let amountReceived = $state(0);
	let change = $derived.by(() => {
		return amountReceived ? total - amountReceived : 0;
	})

	const onCancel = () => {
		items = [];
	}
</script>
<Card>
    <CardContent class="w-[280px]">
        <p class="font-medium">Summary</p>
        <div class="flex flex-col gap-2 mt-2">
            <div class="flex justify-between items-center">
                <p class="text-sm text-muted-foreground">Subtotal:</p>
                <p class="text-sm font-medium">{ formatCurrency(subtotal) }</p>
            </div>
            <div class="flex justify-between items-center">
                <p class="text-sm text-muted-foreground">Discount:</p>
                <p class="text-sm font-medium">{ formatCurrency(discount) }</p>
            </div>
        </div>
        <hr class="my-2" />
        <div class="flex justify-between items-center">
            <p class="text-sm font-medium">Total:</p>
            <p class="text-sm font-medium">{ formatCurrency(total) }</p>
        </div>

        <div class="flex flex-col gap-2 mt-4">
            <Label>Amount Received:</Label>
            <Input type="number" placeholder="0.00" bind:value={amountReceived} />
        </div>

        <div class="flex flex-col gap-2 mt-4">
            <Label>Change:</Label>
            <Input type="number" placeholder="0.00" readonly value={change} />
        </div>

        <div class="flex flex-col gap-2 mt-4">
            <form method="post" action="/customers/daily-sales?/createDailySales" use:enhance>
                <input type="hidden" name="customer_id" value={walkInCustomerId} />
                <input type="hidden" name="total_cost" value={total} />
                <input type="hidden" name="order_type" value="onetime" />
                <input type="hidden" name="sales_channel" value={SalesChannel.POS} />
                <input type="hidden" name="staff_user_id" value={staffUserId} />
                <input type="hidden" name="date_ordered" value={dateOrdered} />
                <input type="hidden" name="notes" value="" />
                {#each items as item, i (item.product_id)}
                    <input type="hidden" name={`products.${i}.product_id`} value={item.product_id} />
                    <input type="hidden" name={`products.${i}.package_id`} value={item.package_id} />
                    <input type="hidden" name={`products.${i}.quantity`} value={item.quantity} />
                    <input type="hidden" name={`products.${i}.total_price`} value={item.total_cost} />
                    <input type="hidden" name={`products.${i}.unit_price`} value={item.sale_price} />
                    <input type="hidden" name={`products.${i}.serial_number`} value={item.serial_number} />
                {/each}
                <Button type="submit" class="w-full">Save Sale</Button>
            </form>
            <div class="flex gap-2 [&>button]:flex-1">
                <Button variant="outline" onclick={onCancel}>Cancel</Button>
                <Button variant="outline" class="invisible">Print</Button>
            </div>
        </div>
    </CardContent>
</Card>
