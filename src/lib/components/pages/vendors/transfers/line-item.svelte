<script lang="ts">
	import QuantityStepper from '$lib/components/common/quantity-stepper.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Item, ItemContent, ItemDescription, ItemTitle } from '$lib/components/ui/item';
	import { Switch } from '$lib/components/ui/switch';
	import { Trash } from '@lucide/svelte';

	let { quantity = $bindable<number>(4) } = $props();
	let trackSerialNumber = $state(true);
	let snInput = $state<HTMLInputElement | null>(null);
	let snValue = $state<string>();

	const onInputInter = async (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			console.log(snValue);

			snValue = '';
			snInput?.focus();
		}
	};
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
					<Badge variant="outline" class="border-amber-400 bg-amber-50 text-amber-600">
						0 0f 0 serials
					</Badge>
				{/if}
			</div>
		</div>

		{#if trackSerialNumber}
			<div class="space-y-2">
				<div class="flex gap-1">
					{#each { length: quantity }, i}
						<div class="rounded-md border border-dashed px-2 py-1 text-xs text-muted-foreground">
							Unit {i + 1}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<Input
			bind:ref={snInput}
			bind:value={snValue}
			placeholder="Type serial numbers here..."
			onkeydown={onInputInter}
		/>
	</ItemContent>
</Item>
