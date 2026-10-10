<script lang="ts">
	import QuantityStepper from '$lib/components/common/quantity-stepper.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Item, ItemContent, ItemDescription, ItemTitle } from '$lib/components/ui/item';
	import { Switch } from '$lib/components/ui/switch';
	import { Trash } from '@lucide/svelte';
</script>

<Item variant="outline">
	<ItemContent class="space-y-2">
		<div class="flex gap-3">
			<div class="flex-1">
				<ItemTitle>Laptop 05</ItemTitle>
				<ItemDescription>₱520 each</ItemDescription>
			</div>
			<Button variant="ghost" size="icon" class="cursor-pointer">
				<Trash class="text-red-500" />
			</Button>
		</div>
		<div class="flex items-center justify-between">
			<QuantityStepper min={0} />
			<p class="text-sm font-bold">₱2000.00</p>
		</div>

		<hr />

		<div class="flex items-center justify-between">
			<div>
				<p class="text-xs font-semibold">Track serial numbers</p>
				<p class="text-xs text-muted-foreground">Turn on for items with unique serials, like laptops</p>
			</div>
			<Switch />
		</div>
	</ItemContent>
</Item>
