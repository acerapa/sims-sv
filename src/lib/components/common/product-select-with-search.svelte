<script lang="ts">
	import { page } from '$app/state';
	import { Search } from '@lucide/svelte';

	const products = $derived(page.data.products);
</script>

<div class="group relative">
	<div
		class="flex items-center gap-3 rounded-md border border-input p-2 group-focus-within:border-ring group-focus-within:ring-[3px] group-focus-within:ring-ring/50"
	>
		<Search class="size-5 text-muted-foreground" />
		<input type="search" class="w-full text-sm focus:outline-0" placeholder="Search products" />
	</div>
	<div
	    tabindex="-1"
		class="absolute top-12 hidden w-full rounded-md border border-ring bg-white p-2 group-focus-within:block"
	>
		Test
	</div>
</div>
