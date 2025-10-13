<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';

	const inventoryNavs = [
		{
			name: 'Overview',
			path: '/inventory'
		},
		{
			name: 'Receive PO',
			path: '/inventory/receive-po'
		},
		{
			name: 'Transfers',
			path: '/inventory/transfers'
		},
		{
			name: 'Returns',
			path: '/inventory/returns'
		},
		{
			name: 'Adjustments',
			path: '/inventory/adjustments'
		}
	] as const;
</script>

<section>
	<nav class="border-b">
		{#each inventoryNavs as nav (nav.name)}
			<a href={resolve(nav.path)} class="cursor-pointer">
				<Button
					variant="ghost"
					class="rounded-none border-b-2 border-transparent text-muted-foreground hover:border-blue-300 hover:bg-transparent hover:text-blue-400"
				>
					{nav.name}
				</Button>
			</a>
		{/each}
	</nav>
</section>
