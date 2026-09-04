<script lang="ts">
	import { Card, CardContent } from "$lib/components/ui/card";
	import { Table, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";

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
                </TableRow>
            </TableHeader>
        </Table>
    </CardContent>
</Card>
