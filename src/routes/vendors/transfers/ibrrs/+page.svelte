<script lang="ts">
	import { page } from '$app/state';
	import IBRRForm from '$lib/components/pages/vendors/transfers/ibrrs/IBRRForm.svelte';
	import { Button } from '$lib/components/ui/button';
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
	import { Ellipsis, Search } from '@lucide/svelte';

	const ibrrs = $derived(page.data.ibrrs);
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="space-y-2">
				<CardTitle>Inter-Branch Receiving Reports</CardTitle>
				<CardDescription>Track and manage inventory receipts from other locations</CardDescription>
			</div>
			<IBRRForm />
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
							<Button variant="ghost" size="icon">
								<Ellipsis class="size-4" />
							</Button>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</CardContent>
</Card>
