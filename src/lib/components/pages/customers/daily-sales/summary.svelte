<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent } from "$lib/components/ui/card";
	import { Input } from "$lib/components/ui/input";
	import Label from "$lib/components/ui/label/label.svelte";

</script>
<Card>
    <CardContent class="w-[280px]">
        <p class="font-medium">Summary</p>
        <div class="flex flex-col gap-2 mt-2">
            <div class="flex justify-between items-center">
                <p class="text-sm text-muted-foreground">Subtotal:</p>
                <p class="text-sm font-medium">0.00</p>
            </div>
            <div class="flex justify-between items-center">
                <p class="text-sm text-muted-foreground">Discount:</p>
                <p class="text-sm font-medium">0.00</p>
            </div>
            <div class="flex justify-between items-center">
                <p class="text-sm text-muted-foreground">Tax:</p>
                <p class="text-sm font-medium">0.00</p>
            </div>
        </div>
        <hr class="my-2" />
        <div class="flex justify-between items-center">
            <p class="text-sm font-medium">Total:</p>
            <p class="text-sm font-medium">0.00</p>
        </div>

        <div class="flex flex-col gap-2 mt-4">
            <Label>Amount Received:</Label>
            <Input type="number" placeholder="0.00" />
        </div>

        <div class="flex flex-col gap-2 mt-4">
            <Label>Change:</Label>
            <Input type="number"  readonly />
        </div>

        <div class="flex flex-col gap-2 mt-4">
            <Button>Save Sale</Button>
            <div class="flex gap-2 [&>button]:flex-1">
                <Button variant="outline">Cancel</Button>
                <Button variant="outline">Print</Button>
            </div>
        </div>
    </CardContent>
</Card>
