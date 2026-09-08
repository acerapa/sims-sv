<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent } from "$lib/components/ui/card";
	import { Input } from "$lib/components/ui/input";
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";
	import { ChevronLeft, ChevronRight } from "@lucide/svelte";

	let items = $state([
		{ name: "Laptop 4", quantity: 1, price: 1000, total: 1000 },
		{ name: "Laptop 5", quantity: 2, price: 2000, total: 4000 },
	]);

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
                            <Button variant="outline" size="icon">
                                <ChevronLeft />
                            </Button>
                            <Input min="1" class="field-sizing-content max-w-16" bind:value={item.quantity} />
                            <Button variant="outline" size="icon">
                                <ChevronRight />
                            </Button>
                        </TableCell>
                        <TableCell>₱{item.price}.00</TableCell>
                        <TableCell>₱{item.total}.00</TableCell>
                    </TableRow>
                {/each}
            </TableBody>
        </Table>
    </CardContent>
</Card>
