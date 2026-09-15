<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent } from "$lib/components/ui/card";
	import { Input } from "$lib/components/ui/input";
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";
	import type { DailySalesItem } from "$lib/types/global";
	import { formatCurrency } from "$lib/utils/common";
	import { ChevronLeft, ChevronRight } from "@lucide/svelte";

	const { items = $bindable<DailySalesItem[]>() } = $props();
	const onIncreaseQuantity = (productId: number) => {
		const index = items.findIndex((item: DailySalesItem) => item.product_id === productId);
		if (index !== -1) {
			items[index].quantity += 1;
			items[index].total_cost = items[index].quantity * items[index].sale_price;
		}
	};
	const onDecreaseQuantity = (productId: number) => {
		const index = items.findIndex((item: DailySalesItem) => item.product_id === productId);
		if (index !== -1) {
		    if (items[index].quantity > 1) {
				items[index].quantity -= 1;
				items[index].total_cost = items[index].quantity * items[index].sale_price;
			}
		}
	};

</script>
<Card class="w-full">
    <CardContent>
        <p class="font-medium">Cart</p>
        <Table>
            <TableHeader>
                <TableRow class="hover:[&,&>svelte-css-wrapper]:[&>th,td]:bg-white">
                    <TableHead class="text-muted-foreground">Item</TableHead>
                    <TableHead class="text-muted-foreground">Quantity</TableHead>
                    <TableHead class="text-muted-foreground">Price</TableHead>
                    <TableHead class="text-muted-foreground">Total Price</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#each items as item (item)}
                    <TableRow>
                        <TableCell>{item.name}</TableCell>
                        <TableCell class="flex items-center gap-2">
                            <Button onclick={() => onIncreaseQuantity(item.product_id)} variant="outline" size="icon">
                                <ChevronLeft />
                            </Button>
                            <Input min="1" class="field-sizing-content max-w-16" bind:value={item.quantity} />
                            <Button disabled={item.quantity === 1} onclick={() => onDecreaseQuantity(item.product_id)} variant="outline" size="icon">
                                <ChevronRight />
                            </Button>
                        </TableCell>
                        <TableCell>{formatCurrency(item.sale_price)}</TableCell>
                        <TableCell>{formatCurrency(item.total_cost)}</TableCell>
                    </TableRow>
                {/each}
                {#if !items || items?.length === 0}
                    <TableRow>
                        <TableCell colspan={4} class="text-center text-slate-400">No items in cart</TableCell>
                    </TableRow>
                {/if}
            </TableBody>
        </Table>
    </CardContent>
</Card>
