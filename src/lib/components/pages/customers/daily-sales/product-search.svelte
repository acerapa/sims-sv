<script lang='ts'>
	import { Card, CardContent } from "$lib/components/ui/card";
	import { Label } from "$lib/components/ui/label";
	import { Search } from "@lucide/svelte";

</script>
<Card>
    <CardContent>
        <div class="flex flex-col gap-2">
            <Label for="product-search" class="text-base">Products</Label>
            <div class="flex gap-2 items-center border rounded-lg px-3 py-2">
                <Search class="w-4 h-4 text-gray-500" />
                <input id="product-search" placeholder="Search product by name or item code" type="search" class="focus:outline-0 text-sm" />
            </div>
            <div class="flex gap-2 cursor-pointer">
                <div class="flex gap-2 p-2 justify-between w-full border rounded-lg items-center">
                    <div>
                        <p class="text-sm font-medium">Laptop 4</p>
                        <small class="text-xs text-muted-foreground">SKU: SKU123</small>
                    </div>
                    <span class="text-sm font-medium">₱500.00</span>
                </div>
            </div>
        </div>
    </CardContent>
</Card>
