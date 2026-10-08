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

	let { data }: PageProps = $props();

	let fixAssets = $derived(data?.fixAssets || []);

	const assetTransfers = [
		{ no: 'FA-001', transferDate: 'January 15, 2025', itemsCount: 3 },
		{ no: 'FA-002', transferDate: 'February 4, 2025', itemsCount: 6 },
		{ no: 'FA-003', transferDate: 'March 21, 2025', itemsCount: 2 },
		{ no: 'FA-004', transferDate: 'April 9, 2025', itemsCount: 5 },
		{ no: 'FA-005', transferDate: 'May 16, 2025', itemsCount: 4 }
	];
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="space-y-2">
				<CardTitle>Fix Assets</CardTitle>
				<CardDescription>Track inventories that are converted to assets</CardDescription>
			</div>
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
					<TableHead>Transfer Date</TableHead>
					<TableHead class="text-center"># of Items</TableHead>
					<TableHead>Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each assetTransfers as assetTransfer (assetTransfer.no)}
					<TableRow>
						<TableCell>{assetTransfer.no}</TableCell>
						<TableCell>{assetTransfer.transferDate}</TableCell>
						<TableCell class="text-center">{assetTransfer.itemsCount}</TableCell>
						<TableCell class="text-muted-foreground">—</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</CardContent>
</Card>
