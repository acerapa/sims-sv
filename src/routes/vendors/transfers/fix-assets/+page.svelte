<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
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
	import type { PageProps } from './$types';
	import FixAssetsForm from '$lib/components/pages/vendors/transfers/fix-assets/fix-assets-form.svelte';
	import { capitalizeFirstLetter } from '$lib/utils/common';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { buttonVariants } from '$lib/components/ui/button';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';

	let { data }: PageProps = $props();
	let fixAssets = $derived(data?.fixAssets || []);
	let openFixAssetForm = $state(false);

	const onViewFixAsset = async (id: number) => {
		openFixAssetForm = true;
		await goto(
			resolve(`/vendors/transfers/fix-assets?id=${id}` as `/vendors/transfers/fix-assets`)
		);
	};
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="space-y-2">
				<CardTitle>Fix Assets</CardTitle>
				<CardDescription>Track inventories that are converted to assets</CardDescription>
			</div>

			<FixAssetsForm bind:open={openFixAssetForm} />
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
					<TableHead>No.</TableHead>
					<TableHead>User</TableHead>
					<TableHead>Transfer Date</TableHead>
					<TableHead class="text-center"># of Items</TableHead>
					<TableHead>Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each fixAssets as fixAsset (fixAsset.id)}
					<TableRow>
						<TableCell>FA-{fixAsset.id}</TableCell>
						<TableCell>{fixAsset.user ? capitalizeFirstLetter(fixAsset.user) : '—'}</TableCell>
						<TableCell>
							{new Date(fixAsset.date_transfered).toLocaleDateString('default', {
								day: 'numeric',
								month: 'long',
								year: 'numeric'
							})}
						</TableCell>
						<TableCell class="text-center">{fixAsset.items_count}</TableCell>
						<TableCell class="text-muted-foreground">
							<DropdownMenu>
								<DropdownMenuTrigger class={buttonVariants({ variant: 'ghost', size: 'sm' })}>
									<Ellipsis />
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem onSelect={() => onViewFixAsset(fixAsset.id)} class="space-x-2">
										<Eye />
										<span>View</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</CardContent>
</Card>
