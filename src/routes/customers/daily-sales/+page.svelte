<script lang="ts">
	import Cart from '$lib/components/pages/customers/daily-sales/cart.svelte';
	import ProductSearch from '$lib/components/pages/customers/daily-sales/product-search.svelte';
	import Summary from '$lib/components/pages/customers/daily-sales/summary.svelte';
	import type { DailySalesItem } from '$lib/types/global';

	let cartProducts = $state<DailySalesItem[]>([]);
</script>

<svelte:head>
	<title>RamTech | Daily Sales</title>
	<meta name="description" content="Manage daily sales" />
</svelte:head>

<section class="flex gap-1">
	<ProductSearch bind:items={cartProducts} />
	<Cart bind:items={cartProducts} />
	<Summary />
</section>
