<script lang="ts">
	import ProductSelectWithSearch from '$lib/components/common/product-select-with-search.svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import LineItem from '../line-item.svelte';

	import type { FixAssetItem, ProductItem } from '$lib/types/global';

	let fixAssetItems = $state<FixAssetItem[]>([]);

	const handleSelectProduct = (product: ProductItem) => {
		fixAssetItems.push({
			item_description: product.purchase_description,
			cost: Number(product.cost || '0'),
			total_cost: Number(product.cost || '0'),
			product_id: product.id,
			quantity: 1,
			serial_number: []
		});
	};

	$inspect(fixAssetItems);
</script>

<Card>
	<CardHeader>
		<CardTitle>Items</CardTitle>
	</CardHeader>
	<CardContent class="space-y-4">
		<ProductSelectWithSearch selected={fixAssetItems} {handleSelectProduct} />

		<div class="space-y-2">
			{#each fixAssetItems as item (item.product_id)}
				<LineItem
				    bind:cost={item.cost}
					bind:total_cost={item.total_cost}
					itemDescription={item.item_description}
					bind:quantity={item.quantity}
					bind:serialNumbers={item.serial_number}
				/>
			{/each}
		</div>
	</CardContent>
</Card>
