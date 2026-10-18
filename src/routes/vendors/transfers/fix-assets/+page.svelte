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
	import { Search } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import FixAssetsForm from '$lib/components/pages/vendors/transfers/fix-assets/fix-assets-form.svelte';
	import { capitalizeFirstLetter } from '$lib/utils/common';

	let { data }: PageProps = $props();

	let fixAssets = $derived(data?.fixAssets || []);
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="space-y-2">
				<CardTitle>Fix Assets</CardTitle>
				<CardDescription>Track inventories that are converted to assets</CardDescription>
			</div>

			<FixAssetsForm />
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
						<TableCell class="text-muted-foreground">—</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</CardContent>
</Card>
