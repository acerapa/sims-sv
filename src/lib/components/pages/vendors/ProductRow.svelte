<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Ellipsis } from '@lucide/svelte';
	import type { PageData } from '../../../../routes/vendors/inventory/$types';
	import ProductBadge from './ProductBadge.svelte';

	type Product = PageData['products'][number];
	let { product }: { product: Product } = $props();

	let textColor = $derived.by(() => {
		if (product.quantity > product.minimum_quantity!) {
			return 'text-green-500';
		} else if (product.quantity <= product.minimum_quantity! && product.quantity != 0) {
			return 'text-yellow-500';
		} else {
			return 'text-red-500';
		}
	});
</script>

<div
	class="flex w-full items-center rounded-lg bg-muted/30 p-4 transition-colors hover:bg-muted/50"
>
	<div class="grid w-full grid-cols-11 items-center gap-3">
		<div class="col-span-3 space-x-2">
			<p class="text-sm font-medium">{product.purchase_description}</p>
			<p class="text-xs text-muted-foreground">SKU: {product.sku}</p>
		</div>
		<p class="col-span-2 text-sm text-muted-foreground">{product.category.name}</p>
		<p class="col-span-2 font-semibold">₱{parseFloat(product.sale_price).toFixed(2)}</p>
		<div class="col-span-2 space-y-1">
			<p class="text-sm text-muted-foreground">
				<span class={[textColor, 'font-bold']}>{product.quantity}</span>/{product.minimum_quantity}
			</p>
			<p class="text-xs text-muted-foreground">Current/Min</p>
		</div>
		<ProductBadge quantity={product.quantity} minimum_quantity={product.minimum_quantity} />
		<div class="col-span-1 text-end">
			<Button variant="ghost">
				<Ellipsis />
			</Button>
		</div>
	</div>
</div>
