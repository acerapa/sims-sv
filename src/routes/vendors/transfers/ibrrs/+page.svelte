<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import IBRRForm from '$lib/components/pages/vendors/transfers/ibrrs/IBRRForm.svelte';
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

	const ibrrs = $derived(page.data.ibrrs);
	let ibrr = $derived(page.data.ibrr);
	let openIbrrForm = $state(false);

	const onViewIbrr = async (ibrrId: number) => {
		openIbrrForm = true;
		await goto(resolve(`/vendors/transfers/ibrrs?id=${ibrrId}` as '/vendors/transfers/ibrrs'));
	};
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="space-y-2">
				<CardTitle>Inter-Branch Receiving Reports</CardTitle>
				<CardDescription>Track and manage inventory receipts from other locations</CardDescription>
			</div>
			{#key ibrr}
				<IBRRForm bind:open={openIbrrForm} bind:ibrr isViewOnly={ibrr !== null} />
			{/key}
		</div>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="relative">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input type="search" placeholder="Search ibrrs..." class="h-10 pl-9" />
		</div>

		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>IBRR No.</TableHead>
					<TableHead>STR No.</TableHead>
					<TableHead>Source</TableHead>
					<TableHead>Received Date</TableHead>
					<TableHead class="text-center"># of Items</TableHead>
					<TableHead>Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each ibrrs as ibrr (ibrr.id)}
					<TableRow>
						<TableCell>IBRR-00{ibrr.id}</TableCell>
						<TableCell>{ibrr.str_id}</TableCell>
						<TableCell>{ibrr.source_store_name}</TableCell>
						<TableCell>
							{ibrr.received_date.toLocaleString('default', {
								day: 'numeric',
								month: 'long',
								year: 'numeric'
							})}
						</TableCell>
						<TableCell class="text-center">{ibrr.items_count}</TableCell>
						<TableCell>
							<DropdownMenu>
								<DropdownMenuTrigger class={buttonVariants({ variant: 'ghost', size: 'sm' })}>
									<Ellipsis />
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem onSelect={() => onViewIbrr(ibrr.id)} class="space-x-2">
										<Eye />
										<span>View</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</TableCell>
					</TableRow>
				{/each}
				{#if ibrrs?.length === 0}
					<TableRow>
						<TableCell colspan={5} class="text-center text-muted-foreground">
							No inter-branch receiving reports found!
						</TableCell>
					</TableRow>
				{/if}
			</TableBody>
		</Table>
	</CardContent>
</Card>
