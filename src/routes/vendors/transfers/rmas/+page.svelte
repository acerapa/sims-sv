<script lang="ts">
	import RMAForm from '$lib/components/pages/vendors/transfers/rmas/RMAForm.svelte';
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
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="space-y-2">
				<CardTitle>Return Merchandise Authorization</CardTitle>
				<CardDescription>Manage returns to suppliers</CardDescription>
			</div>
			<RMAForm />
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
				<TableRow>
					<TableCell>RMA-001</TableCell>
					<TableCell>Supplier A</TableCell>
					<TableCell>2023-01-01</TableCell>
					<TableCell class="text-center">5</TableCell>
					<TableCell>
						<Button variant="ghost" size="icon">
							<Ellipsis />
						</Button>
					</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>RMA-002</TableCell>
					<TableCell>Supplier B</TableCell>
					<TableCell>2023-02-01</TableCell>
					<TableCell class="text-center">3</TableCell>
					<TableCell>
						<Button variant="ghost" size="icon">
							<Ellipsis />
						</Button>
					</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>RMA-003</TableCell>
					<TableCell>Supplier C</TableCell>
					<TableCell>2023-03-01</TableCell>
					<TableCell class="text-center">2</TableCell>
					<TableCell>
						<Button variant="ghost" size="icon">
							<Ellipsis />
						</Button>
					</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>RMA-004</TableCell>
					<TableCell>Supplier D</TableCell>
					<TableCell>2023-04-01</TableCell>
					<TableCell class="text-center">4</TableCell>
					<TableCell>
						<Button variant="ghost" size="icon">
							<Ellipsis />
						</Button>
					</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>RMA-005</TableCell>
					<TableCell>Supplier E</TableCell>
					<TableCell>2023-05-01</TableCell>
					<TableCell class="text-center">6</TableCell>
					<TableCell>
						<Button variant="ghost" size="icon">
							<Ellipsis />
						</Button>
					</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	</CardContent>
</Card>
