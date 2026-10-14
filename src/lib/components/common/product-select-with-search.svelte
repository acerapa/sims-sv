<script lang="ts">
	import { page } from '$app/state';
	import { Check, Search } from '@lucide/svelte';
	import { Button } from '../ui/button';
	import type { ProductItem } from '$lib/types/global';

	const products = $derived(page.data.products as ProductItem[]);
	let { selected = $bindable<ProductItem[]>([]) } = $props();
	let search = $state('');
	const filteredProducts = $derived(
		products.filter((p) => p.purchase_description.toLowerCase().includes(search.toLowerCase()))
	);

	const onSelectProduct = (product: ProductItem) => {
		selected.push(product);

		search = '';
		const active = document.activeElement;
		if (active instanceof HTMLElement) active.blur();
	};

	const isProductSelected = (productId: number) => {
		return selected.some((p: ProductItem) => p.id == productId);
	};
</script>

<div class="group relative">
	<div
		class="flex items-center gap-3 rounded-md border border-input p-2 group-focus-within:border-ring group-focus-within:ring-[3px] group-focus-within:ring-ring/50"
	>
		<Search class="size-5 text-muted-foreground" />
		<input
			bind:value={search}
			type="search"
			class="w-full text-sm focus:outline-0"
			placeholder="Search products"
		/>
	</div>
	<div
		tabindex="-1"
		class="absolute top-12 z-10 hidden max-h-[300px] w-full flex-col overflow-y-auto rounded-md bg-white group-focus-within:flex"
	>
		{#each filteredProducts as product (product.id)}
			<Button
				variant="outline"
				onclick={() => onSelectProduct(product)}
				disabled={isProductSelected(product.id)}
				class="flex justify-between rounded-none border-b-0 text-left text-sm font-normal first:rounded-t-md last:rounded-b-md last:border-b-1"
			>
				<span>{product.purchase_description}</span>
				{#if isProductSelected(product.id)}
					<Check />
				{/if}
			</Button>
		{:else}
			<p class="text-muted-foreground text-sm text-center border rounded-md p-3">
				No products matching <span class="font-medium">{search}</span>
			</p>
		{/each}
	</div>
</div>
