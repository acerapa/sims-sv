<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import RMAForm from '$lib/components/pages/vendors/transfers/rmas/RMAForm.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Ellipsis, Eye, Search } from '@lucide/svelte';

	const rmas = $derived(page.data.rmas);
	let rma = $derived(page.data.rma || null);
	let openRmaForm = $state(false);

	const onViewRma = async (rmaId: number) => {
		openRmaForm = true;
		await goto(resolve(`/vendors/transfers/rmas?id=${rmaId}` as '/vendors/transfers/rmas'));
	};
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="space-y-2">
				<CardTitle>Return Merchandise Authorization</CardTitle>
				<CardDescription>Manage returns to suppliers</CardDescription>
			</div>
			{#key rma}
				<RMAForm bind:open={openRmaForm} bind:rma isViewOnly={rma !== null} />
			{/key}
		</div>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="relative">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input type="search" placeholder="Search rmas..." class="h-10 pl-9" />
		</div>
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>RMA No.</TableHead>
					<TableHead>Supplier</TableHead>
					<TableHead>Date</TableHead>
					<TableHead class="text-center"># of Items</TableHead>
					<TableHead>Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#if !rmas || rmas.length === 0}
					<TableRow>
						<TableCell colspan={5} class="py-4 text-center text-muted-foreground">
							No Data!
						</TableCell>
					</TableRow>
				{:else}
					{#each rmas as rma (rma.id)}
						<TableRow>
							<TableCell>RMA-00{rma.id}</TableCell>
							<TableCell>{rma.supplier_name}</TableCell>
							<TableCell>
								{rma.date_returned.toLocaleString('default', {
									day: 'numeric',
									month: 'long',
									year: 'numeric'
								})}
							</TableCell>
							<TableCell class="text-center">{rma.items_count}</TableCell>
							<TableCell>
								<DropdownMenu>
									<DropdownMenuTrigger class={buttonVariants({ variant: 'ghost', size: 'sm' })}>
										<Ellipsis />
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<DropdownMenuItem onSelect={() => onViewRma(rma.id)} class="space-x-2">
											<Eye />
											<span>View</span>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</TableCell>
						</TableRow>
					{/each}
				{/if}
			</TableBody>
		</Table>
	</CardContent>
</Card>
