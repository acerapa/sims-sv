<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { page } from '$app/state';
	import { isRouteActive } from '$lib/utils/routes';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { ChevronDown } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	const path = $derived(page.route.id as string);

	const inventoryNavs = [
		{
			name: 'Item List',
			path: '/vendors/inventory'
		},
		{
			name: 'Receive PO',
			path: '/vendors/receive-po'
		},
		{
			name: 'Transfers',
			path: '/vendors/transfers'
		},
		{
			name: 'Bills',
			path: '/vendors/bills'
		},
		{
			name: 'Physical Inventory',
			path: '/vendors/physical-inventory'
		},
		{
			name: 'Suppliers',
			path: '/vendors/suppliers'
		},
		{
			name: 'Item Categories',
			path: '/vendors/categories'
		}
	] as const;
</script>

<section>
	<nav class="border-b">
		{#each inventoryNavs as nav (nav.name)}
			{#if nav.name === 'Transfers'}
				<DropdownMenu>
					<DropdownMenuTrigger
						class={[
							buttonVariants({ variant: 'ghost' }),
							`rounded-none border-b-2 border-transparent text-muted-foreground hover:border-blue-300 hover:bg-transparent hover:text-blue-400
				  ${isRouteActive(nav.path, path, true) ? '!border-blue-500 !text-blue-500 hover:border-blue-500 hover:text-blue-500' : ''}`
						]}
					>
						Transfers

						<ChevronDown class="size-3.5" />
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem onSelect={() => goto(resolve('/vendors/transfers/strs'))}>
							Stock Transfer Request (STR)
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={() => goto(resolve('/vendors/transfers/ibrrs'))}>
							Inter-Branch Reciving (IBRR)
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={() => goto(resolve('/vendors/transfers/rmas'))}>
							Return Merchandise Authorization (RMA)
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			{:else}
				<a href={resolve(nav.path)} class="cursor-pointer">
					<Button
						variant="ghost"
						class={`rounded-none border-b-2 border-transparent text-muted-foreground hover:border-blue-300 hover:bg-transparent hover:text-blue-400
					  ${isRouteActive(nav.path, path, true) ? 'border-blue-500 text-blue-500 hover:border-blue-500 hover:text-blue-500' : ''}`}
					>
						{nav.name}
					</Button>
				</a>
			{/if}
		{/each}
	</nav>
</section>
