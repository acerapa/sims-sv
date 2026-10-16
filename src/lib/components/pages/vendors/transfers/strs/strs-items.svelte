<script lang="ts">
	import ProductSelectWithSearch from '$lib/components/common/product-select-with-search.svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { ProductItem, STRItem } from '$lib/types/global';
	import LineItem from '../line-item.svelte';

	let { items = $bindable<STRItem[]>([]) } = $props();

	const handleSelectProduct = (product: ProductItem) => {
		items.push({
			item_description: product.purchase_description,
			cost: Number(product.cost || '0'),
			total_cost: Number(product.cost || '0'),
			product_id: product.id,
			quantity: 1,
			serial_numbers: []
		});
	};

	const handleRemoveProduct = (productId: number) => {
		items = items.filter((p) => p.product_id != productId);
	};
</script>

<Card>
	<CardHeader>
		<CardTitle>Items</CardTitle>
	</CardHeader>
	<CardContent class="space-y-4">
		<ProductSelectWithSearch selected={items} {handleSelectProduct} />

		<div class="space-y-2">
			{#each items.toReversed() as item (item.product_id)}
				<LineItem
					bind:cost={item.cost}
					bind:total_cost={item.total_cost}
					itemDescription={item.item_description}
					bind:quantity={item.quantity}
					bind:serialNumbers={item.serial_numbers}
					handleRemoveItem={() => handleRemoveProduct(item.product_id)}
				/>
			{:else}
				<p class="text-muted-foreground text-sm text-center">No products selected.</p>
			{/each}
		</div>
	</CardContent>
</Card>
