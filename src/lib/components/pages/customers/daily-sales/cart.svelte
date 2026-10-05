<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import {
		Collapsible,
		CollapsibleContent,
		CollapsibleTrigger
	} from '$lib/components/ui/collapsible';
	import { Field, FieldGroup } from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import { Item, ItemContent, ItemDescription, ItemTitle } from '$lib/components/ui/item';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import type { DailySalesItem } from '$lib/types/global';
	import { formatCurrency } from '$lib/utils/common';
	import {
		ChevronDown,
		CircleAlert,
		CircleCheck,
		Minus,
		Plus,
		Trash,
	} from '@lucide/svelte';

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

	const countFilledSerialNumbers = (item: DailySalesItem) => {
		return item.serial_numbers.filter((sn) => sn?.trim() !== '').length;
	};

	const areSerialNumbersFilled = (item: DailySalesItem) => {
		return (
			item.serial_numbers.length === item.quantity &&
			item.serial_numbers.every((sn) => sn?.trim() !== '')
		);
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

						<div class="mt-2 space-y-2 border-t border-dashed pt-2">
							<Field>
								<FieldGroup class="flex-row gap-2">
									<Checkbox
										bind:checked={item.has_sn}
										aria-errormessage="true"
										class="data-[state=checked]:border-amber-600 data-[state=checked]:bg-amber-600"
									/>
									<Label class="text-sm font-light">Check if this item needs serial tracking</Label>
								</FieldGroup>
							</Field>
							{#if item.has_sn}
								<Collapsible open={item.has_sn}>
									<div
										class={'mb-2 flex max-w-80 items-center justify-between rounded-md border border-amber-600 px-2' +
											(areSerialNumbersFilled(item) ? ' border-green-500 bg-green-100/10' : '')}
									>
										<small
											class={'flex items-center gap-1 text-left text-xs text-amber-600' +
												(areSerialNumbersFilled(item) ? ' text-green-500' : '')}
										>
											{#if areSerialNumbersFilled(item)}
												<CircleCheck class="w-3.5" />
											{:else}
												<CircleAlert class="w-3.5" />
											{/if}
											{countFilledSerialNumbers(item)} of {item.quantity} entered
										</small>
										<CollapsibleTrigger
											class={buttonVariants({ variant: 'ghost', size: 'icon-sm' }) +
												' cursor-pointer hover:bg-transparent ' +
												(areSerialNumbersFilled(item) ? '' : 'invisible')}
										>
											<ChevronDown class="w-3.5" />
										</CollapsibleTrigger>
									</div>
									<CollapsibleContent>
										<div class="space-y-1">
											{#each { length: item.quantity }, i}
												<Input
													type="text"
													name="serial_number"
													placeholder="Serial Number"
													bind:value={item.serial_numbers[i]}
													class={'max-w-80 ' +
														(item.serial_numbers[i]?.trim() !== '' ? '' : 'border-amber-600')}
												/>
											{/each}
										</div>
									</CollapsibleContent>
								</Collapsible>
							{/if}
						</div>
					</ItemContent>
				</Item>
			{:else}
				<Separator />
				<p class="text-center text-sm text-muted-foreground">No items in cart</p>
			{/each}
		</div>
	</CardContent>
</Card>
