<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Card, CardContent } from '#lib/components/ui/card/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import type { DailySalesItem } from '#lib/types/global.ts';
	import { debounce, formatCurrency } from '#lib/utils/common.ts';
	import { Search } from '@lucide/svelte';
	import { onMount, tick } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import type { getProducts } from '#lib/server/db/queries/products.ts';

	let searchText = $state('');
	let searchInput: HTMLInputElement;

	const { items = $bindable<DailySalesItem[]>() } = $props();

	const focusSearchInput = async () => {
		await tick();
		requestAnimationFrame(() => {
			searchInput?.focus();
		});
	};

	onMount(() => {
		const search = page.url.searchParams.get('search');
		if (search) searchText = search;

		void focusSearchInput();
	});

	const debouncedSearch = debounce(() => {
		const queryParams = new SvelteURLSearchParams(page.url.searchParams);
		queryParams.set('search', searchText);

		goto(resolve(`/customers/daily-sales?${queryParams.toString()}` as '/customers/daily-sales'), {
			keepFocus: true
		});
	}, 800);

	const onSelectProduct = (productId: number) => {
		const product = (page.data.products as getProducts).find((p) => p.id === productId);
		if (product) {
			items.push({
				name: product.sales_description,
				product_id: product.id,
				quantity: 1,
				total_cost: parseFloat(product.sale_price || '0'),
				sale_price: parseFloat(product.sale_price || '0'),
				stock: product.quantity,
				has_sn: false,
				serial_numbers: []
			});
		}
	};

	const isProductDisabled = (productId: number) => {
		return items.some((item: DailySalesItem) => item.product_id === productId);
	};
</script>

<Card>
	<CardContent>
		<div class="flex flex-col gap-2">
			<Label for="product-search" class="text-base">Products</Label>
			<div class="flex items-center gap-2 rounded-lg border px-3 py-2">
				<Search class="h-4 w-4 text-gray-500" />
				<input
					bind:this={searchInput}
					oninput={debouncedSearch}
					bind:value={searchText}
					id="product-search"
					placeholder="Search product by name or item code"
					type="search"
					class="text-sm focus:outline-0"
				/>
			</div>
			<div
				class="flex h-[calc(100vh_-_408px)] cursor-pointer flex-col gap-2 overflow-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
			>
				{#if searchText}
					{#each page.data.products as product (product.id)}
						<button
							onclick={() => onSelectProduct(product.id)}
							disabled={isProductDisabled(product.id)}
							class="disabled:opacity-50"
						>
							<div class="flex w-full items-center justify-between gap-2 rounded-lg border p-2">
								<div class="text-left">
									<p class="line-clamp-2 text-sm font-medium">{product.sales_description}</p>
									<small class="text-xs text-muted-foreground">SKU: {product.sku}</small>
								</div>
								<span class="text-sm font-medium">{formatCurrency(Number(product.sale_price))}</span
								>
							</div>
						</button>
					{/each}
					{#if page.data.products.length === 0}
						<p class="text-center text-sm text-slate-400">No products found</p>
					{/if}
				{:else}
					<p class="text-center text-sm text-slate-400">Find products by name or item code</p>
				{/if}
			</div>
		</div>
	</CardContent>
</Card>
