<script lang="ts">
	import STRForm from '$lib/components/pages/vendors/transfers/strs/STRForm.svelte';
	import { Button } from '$lib/components/ui/button';
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
	import { Ellipsis, Search } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import { setContext } from 'svelte';

	let { data }: PageProps = $props();
	const stores = $derived(data?.stores || []);
	const products = $derived(data?.products || []);

	setContext('products', products);
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="space-y-2">
				<CardTitle>Stock Transfer Requests</CardTitle>
				<CardDescription>Track and manage inventory transfers between locations</CardDescription>
			</div>
			<STRForm {stores} />
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
				<TableRow>
					<TableCell>STR-001</TableCell>
					<TableCell>Warehouse B</TableCell>
					<TableCell>2023-09-15</TableCell>
					<TableCell class="text-center">10</TableCell>
					<TableCell>
						<Button variant="ghost">
							<Ellipsis />
						</Button>
					</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>STR-002</TableCell>
					<TableCell>Warehouse C</TableCell>
					<TableCell>2023-09-16</TableCell>
					<TableCell class="text-center">5</TableCell>
					<TableCell>
						<Button variant="ghost">
							<Ellipsis />
						</Button>
					</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>STR-003</TableCell>
					<TableCell>Warehouse D</TableCell>
					<TableCell>2023-09-17</TableCell>
					<TableCell class="text-center">3</TableCell>
					<TableCell>
						<Button variant="ghost">
							<Ellipsis />
						</Button>
					</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>STR-004</TableCell>
					<TableCell>Warehouse E</TableCell>
					<TableCell>2023-09-18</TableCell>
					<TableCell class="text-center">8</TableCell>
					<TableCell>
						<Button variant="ghost">
							<Ellipsis />
						</Button>
					</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	</CardContent>
</Card>
