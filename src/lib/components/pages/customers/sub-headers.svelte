<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { page } from '$app/state';
	import { isRouteActive } from '$lib/utils/routes';
	const path = $derived(page.route.id as string);

	const inventoryNavs = [
		{
			name: 'Sales Orders',
			path: '/customers/sales-orders'
		},
		{
			name: 'Clients',
			path: '/customers/clients'
		}
	] as const;
</script>

<section>
	<nav class="border-b">
		{#each inventoryNavs as nav (nav.name)}
			<a href={resolve(nav.path)} class="cursor-pointer">
				<Button
					variant="ghost"
					class={`rounded-none border-b-2 border-transparent text-muted-foreground hover:border-blue-300 hover:bg-transparent hover:text-blue-400
					  ${isRouteActive(nav.path, path, true) ? 'border-blue-500 text-blue-500 hover:border-blue-500 hover:text-blue-500' : ''}`}
				>
					{nav.name}
				</Button>
			</a>
		{/each}
	</nav>
</section>
