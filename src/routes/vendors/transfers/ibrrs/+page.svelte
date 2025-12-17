<script lang="ts">
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
				<TableRow>
					<TableCell>IBRR-001</TableCell>
					<TableCell>STR-001</TableCell>
					<TableCell>Branch A</TableCell>
					<TableCell>2023-01-01</TableCell>
					<TableCell class="text-center">10</TableCell>
					<TableCell>
						<Button variant="ghost" size="icon">
							<Ellipsis class="size-4" />
						</Button>
					</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>IBRR-002</TableCell>
					<TableCell>STR-002</TableCell>
					<TableCell>Branch B</TableCell>
					<TableCell>2023-01-02</TableCell>
					<TableCell class="text-center">5</TableCell>
					<TableCell>
						<Button variant="ghost" size="icon">
							<Ellipsis class="size-4" />
						</Button>
					</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>IBRR-003</TableCell>
					<TableCell>STR-003</TableCell>
					<TableCell>Branch C</TableCell>
					<TableCell>2023-01-03</TableCell>
					<TableCell class="text-center">8</TableCell>
					<TableCell>
						<Button variant="ghost" size="icon">
							<Ellipsis class="size-4" />
						</Button>
					</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>IBRR-004</TableCell>
					<TableCell>STR-004</TableCell>
					<TableCell>Branch D</TableCell>
					<TableCell>2023-01-04</TableCell>
					<TableCell class="text-center">12</TableCell>
					<TableCell>
						<Button variant="ghost" size="icon">
							<Ellipsis class="size-4" />
						</Button>
					</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>IBRR-005</TableCell>
					<TableCell>STR-005</TableCell>
					<TableCell>Branch E</TableCell>
					<TableCell>2023-01-05</TableCell>
					<TableCell class="text-center">15</TableCell>
					<TableCell>
						<Button variant="ghost" size="icon">
							<Ellipsis class="size-4" />
						</Button>
					</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	</CardContent>
</Card>
