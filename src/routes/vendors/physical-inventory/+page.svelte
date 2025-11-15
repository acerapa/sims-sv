<script lang="ts">
	import StartInventory from '$lib/components/pages/vendors/phyiscal-inventory/StartInventory.svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Table, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Search } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<Card>
	<CardHeader class="flex items-center justify-between">
		<div class="space-y-1">
			<CardTitle>Physical Inventory</CardTitle>
			<CardDescription>Physical Inventory</CardDescription>
		</div>
		<StartInventory {data} {form} />
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="relative">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input type="search" placeholder="Search Physical Inventory..." class="h-10 pl-9" />
		</div>

		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Count Name</TableHead>
					<TableHead>Date Started</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Items Counted</TableHead>
					<TableHead>Actions</TableHead>
				</TableRow>
			</TableHeader>
		</Table>
	</CardContent>
</Card>
