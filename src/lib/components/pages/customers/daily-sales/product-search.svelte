<script lang='ts'>
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import { Card, CardContent } from "$lib/components/ui/card";
	import { Label } from "$lib/components/ui/label";
	import type { DailySalesItem } from "$lib/types/global";
	import { debounce, formatCurrency } from "$lib/utils/common";
	import { Search } from "@lucide/svelte";
	import { onMount, tick } from "svelte";
	import { SvelteURLSearchParams } from "svelte/reactivity";
	import type { getProducts } from "$lib/server/db/queries/products";

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
		const product = (page.data.products as getProducts).find(p => p.id === productId);
		if (product) {
			items.push({
				name: product.sales_description,
				product_id: product.id,
				quantity: 1,
				total_cost: product.sale_price,
				sale_price: product.sale_price,
				stock: product.quantity
			});
		}
	}

</script>
<Card>
    <CardContent>
        <div class="flex flex-col gap-2">
            <Label for="product-search" class="text-base">Products</Label>
            <div class="flex gap-2 items-center border rounded-lg px-3 py-2">
                <Search class="w-4 h-4 text-gray-500" />
                <input bind:this={searchInput} oninput={debouncedSearch} bind:value={searchText} id="product-search" placeholder="Search product by name or item code" type="search" class="focus:outline-0 text-sm" />
            </div>
            <div class="flex gap-2 cursor-pointer flex-col h-[calc(100vh_-_408px)] overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {#if searchText}
                    {#each page.data.products as product (product.id)}
                        <button onclick={() => onSelectProduct(product.id)}>
                            <div class="flex gap-2 p-2 justify-between w-full border rounded-lg items-center">
                                <div>
                                    <p class="text-sm font-medium">{product.sales_description}</p>
                                    <small class="text-xs text-muted-foreground">SKU: {product.sku}</small>
                                </div>
                                <span class="text-sm font-medium">{formatCurrency(Number(product.sale_price))}</span>
                            </div>
                        </button>
                    {/each}
                    {#if page.data.products.length === 0}
                        <p class="text-sm text-slate-400 text-center">No products found</p>
                    {/if}
                {:else}
                    <p class="text-sm text-slate-400 text-center">Find products by name or item code</p>
                {/if}
            </div>
        </div>
    </CardContent>
</Card>
