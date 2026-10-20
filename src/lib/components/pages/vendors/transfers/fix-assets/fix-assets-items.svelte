<script lang="ts">
	import ProductSelectWithSearch from '$lib/components/common/product-select-with-search.svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import LineItem from '../line-item.svelte';

	import type { FixAssetItem, ProductItem } from '$lib/types/global';
	let { items = $bindable<FixAssetItem[]>([]), isView = $bindable<boolean>(false) } = $props();

	let fixAssetItemsFormatted = $derived.by(() => {
		let faItems: FixAssetItem[] = [];
		items.forEach((f: FixAssetItem) => {
			if (f.serial_numbers.length) {
				f.serial_numbers.forEach((sn: string) => {
					faItems.push({
						...f,
						quantity: 1,
						total_cost: f.cost,
						serial_number: sn
					});
				});
			} else {
				faItems.push(f);
			}
		});

		return faItems;
	});

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
		{#if !isView}
			<ProductSelectWithSearch selected={items} {handleSelectProduct} />
		{/if}
		<div class="space-y-2">
			{#each items.toReversed() as item (item.product_id)}
				<LineItem
					bind:isView
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

		<div class="invisible">
			{#each fixAssetItemsFormatted as item, ndx (item)}
				<input name={`items.${ndx}.product_id`} type="hidden" value={item.product_id} />
				<input name={`items.${ndx}.serial_number`} type="hidden" value={item.serial_number} />
				<input name={`items.${ndx}.quantity`} type="hidden" value={item.quantity} />
				<input name={`items.${ndx}.cost`} type="hidden" value={item.cost} />
				<input name={`items.${ndx}.total_cost`} type="hidden" value={item.total_cost} />
			{/each}
		</div>
	</CardContent>
</Card>
