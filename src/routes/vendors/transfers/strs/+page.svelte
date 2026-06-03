<script lang="ts">
	import STRForm from '$lib/components/pages/vendors/transfers/strs/STRForm.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Ellipsis, Eye, Search } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import { setContext } from 'svelte';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';

	let { data, form }: PageProps = $props();
	const stores = $derived(data?.stores || []);
	const products = $derived(data?.products || []);
	const strs = $derived(data?.strs || []);

	const onViewStr = (id: number) => {
		console.log('View', id);
	};

	setContext('products', () => products);
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="space-y-2">
				<CardTitle>Stock Transfer Requests</CardTitle>
				<CardDescription>Track and manage inventory transfers between locations</CardDescription>
			</div>
			<STRForm {form} {stores} />
		</div>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="relative">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input type="search" placeholder="Search strs..." class="h-10 pl-9" />
		</div>
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>STR No.</TableHead>
					<TableHead>Destination</TableHead>
					<TableHead>Transfer Date</TableHead>
					<TableHead class="text-center"># of Items</TableHead>
					<TableHead>Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each strs as str (str.id)}
					<TableRow>
						<TableCell>STR-00{str.id}</TableCell>
						<TableCell>{str.store_name}</TableCell>
						<TableCell>
							{str.transfer_date.toLocaleString('default', {
								day: 'numeric',
								month: 'long',
								year: 'numeric'
							})}
						</TableCell>
						<TableCell class="text-center">{str.items_count}</TableCell>
						<TableCell>
							<DropdownMenu>
								<DropdownMenuTrigger class={buttonVariants({ variant: 'ghost', size: 'sm' })}>
									<Ellipsis />
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem onSelect={() => onViewStr(str.id)} class="space-x-2">
										<Eye />
										<span>View</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</TableCell>
					</TableRow>
				{/each}
				{#if strs.length === 0}
					<TableRow>
						<TableCell colspan={5} class="text-center text-muted-foreground">
							No stock transfer requests found!
						</TableCell>
					</TableRow>
				{/if}
			</TableBody>
		</Table>
	</CardContent>
</Card>
