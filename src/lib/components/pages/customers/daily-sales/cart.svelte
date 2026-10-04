<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Item, ItemContent, ItemDescription, ItemTitle } from '$lib/components/ui/item';
	import type { DailySalesItem } from '$lib/types/global';
	import { formatCurrency } from '$lib/utils/common';
	import { Minus, Plus, Trash } from '@lucide/svelte';

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
	const onRemoveItem = (productId: number) => {
		const index = items.findIndex((item: DailySalesItem) => item.product_id === productId);
		if (index !== -1) {
			items.splice(index, 1);
		}
	};
</script>

<Card class="w-full">
	<CardContent>
		<p class="font-medium">Cart</p>
		<div class="mt-2 flex flex-col gap-2">
			{#each items as item (item)}
				<Item variant="outline">
					<ItemContent>
						<div class="flex gap-3">
							<div class="flex-1">
								<ItemTitle>{item.name}</ItemTitle>
								<ItemDescription>{formatCurrency(item.sale_price || 0)} each</ItemDescription>
							</div>
							<Button
								variant="ghost"
								size="icon"
								class="cursor-pointer"
								onclick={() => onRemoveItem(item.product_id)}
							>
								<Trash class="text-red-500" />
							</Button>
						</div>

						<div class="mt-4 flex items-center justify-between">
							<ButtonGroup>
								<Button
									disabled={item.quantity === 1}
									onclick={() => onDecreaseQuantity(item.product_id)}
									variant="outline"
									size="icon-sm"
								>
									<Minus />
								</Button>
								<Input
									type="number"
									value={item.quantity}
									class="field-sizing-content h-auto w-fit [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
								/>
								<Button
									variant="outline"
									size="icon-sm"
									onclick={() => onIncreaseQuantity(item.product_id)}
								>
									<Plus />
								</Button>
							</ButtonGroup>
							<p class="font-semibold">{formatCurrency(item.total_cost || 0)}</p>
						</div>
					</ItemContent>
				</Item>
			{/each}
		</div>
	</CardContent>
</Card>
