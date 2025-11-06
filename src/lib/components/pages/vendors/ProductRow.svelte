<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Ellipsis } from '@lucide/svelte';
	import type { PageData } from '../../../../routes/vendors/inventory/$types';

	type Product = PageData['products'][number];
	let { product }: { product: Product } = $props();
	let cost = $derived.by(
		() =>
			product.productToSuppliers.find((s) => s.supplier_id === product.preferred_supplier_id)?.cost
	);
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
		<p class="col-span-2 font-semibold">₱{parseFloat(cost as string).toFixed(2)}</p>
		<div class="col-span-2 space-y-1">
			<p class="text-sm text-muted-foreground">
				<span>{product.quantity}</span>/{product.minimum_quantity}
			</p>
			<p class="text-xs text-muted-foreground">Current/Min</p>
		</div>
		<Badge variant="destructive" class="col-span-1 rounded-full px-3 py-1">Critical</Badge>
		<div class="col-span-1 text-end">
			<Button variant="ghost">
				<Ellipsis />
			</Button>
		</div>
	</div>
</div>
