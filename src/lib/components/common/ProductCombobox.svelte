<script lang="ts" generics="T extends { id: number }">
	import { Button } from '$lib/components/ui/button';
	import {
		Command,
		CommandEmpty,
		CommandInput,
		CommandItem,
		CommandList
	} from '$lib/components/ui/command';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { ChevronsUpDown, Plus } from '@lucide/svelte';

	interface Props {
		products: T[];
		value?: string;
		name: string;
		getLabel: (product: T) => string;
		placeholder?: string;
		searchPlaceholder?: string;
		disabled?: boolean;
		hasError?: boolean;
		disabledIds?: number[];
		onSelect?: () => void;
		onAddNew?: () => void;
		addNewLabel?: string;
	}

	let {
		products,
		value = $bindable(''),
		name,
		getLabel,
		placeholder = 'Select Product',
		searchPlaceholder = 'Search product...',
		disabled = false,
		hasError = false,
		disabledIds = [],
		onSelect,
		onAddNew,
		addNewLabel = 'Add product'
	}: Props = $props();

	let open = $state(false);

	let selectedProduct = $derived.by(() => products.find((p) => p.id === parseInt(value)));
</script>

<Popover bind:open>
	<PopoverTrigger class="w-full" {disabled}>
		<Button
			{disabled}
			variant="outline"
			class={[
				'flex w-full justify-between font-normal disabled:opacity-100',
				hasError ? 'border !border-solid !border-red-500' : '',
				selectedProduct ? '' : 'text-muted-foreground'
			]}
		>
			{selectedProduct ? getLabel(selectedProduct) : placeholder}
			<ChevronsUpDown class="opacity-50" />
		</Button>
	</PopoverTrigger>
	<PopoverContent class="w-[var(--bits-floating-anchor-width)] p-0">
		<Command>
			<CommandInput placeholder={searchPlaceholder} />
			<CommandList>
				{#if onAddNew}
					<CommandItem
						value="__add_product__"
						onclick={() => {
							onAddNew?.();
							open = false;
						}}
					>
						<Plus class="size-4" />
						{addNewLabel}
					</CommandItem>
				{/if}
				{#if !products.length}
					<CommandItem value="" disabled>No Products available</CommandItem>
				{/if}
				<CommandEmpty>No products found.</CommandEmpty>
				{#each products as product (product.id)}
					<CommandItem
						value={getLabel(product)}
						disabled={disabledIds.includes(product.id)}
						onclick={() => {
							value = product.id.toString();
							onSelect?.();
							open = false;
						}}
					>
						{getLabel(product)}
					</CommandItem>
				{/each}
			</CommandList>
		</Command>
	</PopoverContent>
</Popover>
<input type="hidden" {name} {value} />
