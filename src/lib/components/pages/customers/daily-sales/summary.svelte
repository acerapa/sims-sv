<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent } from "$lib/components/ui/card";
	import { Input } from "$lib/components/ui/input";
	import Label from "$lib/components/ui/label/label.svelte";
	import type { DailySalesItem } from "$lib/types/global";
	import { formatCurrency } from "$lib/utils/common";

	let { items = $bindable<DailySalesItem[]>() } = $props();

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
            <Button>Save Sale</Button>
            <div class="flex gap-2 [&>button]:flex-1">
                <Button variant="outline" onclick={onCancel}>Cancel</Button>
                <Button variant="outline" class="invisible">Print</Button>
            </div>
        </div>
    </CardContent>
</Card>
