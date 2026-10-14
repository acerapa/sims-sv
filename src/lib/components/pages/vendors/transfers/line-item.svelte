<script lang="ts">
	import QuantityStepper from '$lib/components/common/quantity-stepper.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Item, ItemContent, ItemDescription, ItemTitle } from '$lib/components/ui/item';
	import { Switch } from '$lib/components/ui/switch';
	import { formatCurrency } from '$lib/utils/common';
	import { Trash, X } from '@lucide/svelte';

	let {
		quantity = $bindable<number>(),
		cost = $bindable<number>(),
		total_cost = $bindable<number>(),
		itemDescription = $bindable<string>(),
		serialNumbers = $bindable<string[]>([]),
		handleRemoveItem = $bindable<() => void>()
	} = $props();
	let trackSerialNumber = $state(false);
	let snInput = $state<HTMLInputElement | null>(null);
	let snValue = $state<string>();
	const isFullfilled = $derived(serialNumbers.length === quantity);
	let errorMessage = $state();

	const onInputInter = async (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			event.preventDefault();

			errorMessage = '';
			if (serialNumbers.includes(snValue)) {
				errorMessage = `Duplicate sn number for: ${snValue}.`;
				return;
			} else {
				serialNumbers.push(snValue);
			}

			snValue = '';
			snInput?.focus();
		}
	};

	const onRemoveSerialNumber = (index: number) => {
		serialNumbers.splice(index, 1);
	};

	const onRemoveItem = () => {
		if (handleRemoveItem) {
			handleRemoveItem();
		}
	};

	const onQuantityChange = () => {
		total_cost = cost * quantity;
	};
</script>

<Item variant="outline">
	<ItemContent class="space-y-2">
		<div class="flex gap-3">
			<div class="flex-1">
				<ItemTitle>{itemDescription}</ItemTitle>
				<ItemDescription>{formatCurrency(cost)} each</ItemDescription>
			</div>
			<Button variant="ghost" size="icon" class="cursor-pointer" onclick={onRemoveItem}>
				<Trash class="text-red-500" />
			</Button>
		</div>
		<div class="flex items-center justify-between">
			<QuantityStepper bind:value={quantity} min={0} onValueChange={onQuantityChange} />
			<p class="text-sm font-bold">{formatCurrency(total_cost)}</p>
		</div>

		<hr />

		<div class="flex items-start justify-between">
			<div>
				<p class="text-xs font-semibold">Track serial numbers</p>
				{#if !trackSerialNumber}
					<p class="text-xs text-muted-foreground">
						Turn on for items with unique serials, like laptops
					</p>
				{/if}
			</div>
			<div class="grid justify-items-end gap-3">
				<Switch bind:checked={trackSerialNumber} />
				{#if trackSerialNumber}
					<Badge
						variant="outline"
						class={isFullfilled
							? 'border-green-500 bg-green-50 text-green-500'
							: 'border-amber-500 bg-amber-50 text-amber-500'}
					>
						{serialNumbers.length} of {quantity} serials
					</Badge>
				{/if}
			</div>
		</div>

		{#if trackSerialNumber}
			<div class="space-y-2">
				<div class="flex gap-1">
					{#each { length: quantity }, i}
						{#if serialNumbers[i]}
							<div
								class="flex items-center justify-between gap-1 rounded-md border border-gray-500 bg-gray-50 pt-1 pb-1.5 pl-2 text-xs text-gray-500"
							>
								{serialNumbers[i]}
								<Button
									variant="ghost"
									size="icon-sm"
									class="h-4 w-6 cursor-pointer"
									onclick={() => onRemoveSerialNumber(i)}
								>
									<X class="mt-0.5 size-3.5" />
								</Button>
							</div>
						{:else}
							<div class="rounded-md border border-dashed px-2 py-1 text-xs text-muted-foreground">
								Unit {i + 1}
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}

		{#if !isFullfilled && trackSerialNumber}
			<div class="space-y-1">
				<Input
					bind:ref={snInput}
					bind:value={snValue}
					placeholder="Type serial numbers here..."
					onkeydown={onInputInter}
					class={errorMessage ? '!border-red-500 bg-red-50' : ''}
				/>
				{#if errorMessage}
					<small class="text-red-500">{errorMessage}</small>
				{/if}
			</div>
		{/if}
	</ItemContent>
</Item>
