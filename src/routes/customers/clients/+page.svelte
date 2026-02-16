<script lang="ts">
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

<svelte:head>
	<title>RamTech | Clients</title>
	<meta name="description" content="RamTech Inventory Dashboard" />
</svelte:head>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="space-y-2">
				<CardTitle>Clients</CardTitle>
				<CardDescription>Manage your client relationships</CardDescription>
			</div>
			<!-- <SupplierForm {form} /> -->
		</div>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="relative">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input type="search" placeholder="Search clients..." class="h-10 pl-9" />
		</div>

		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Client</TableHead>
					<TableHead>Address</TableHead>
					<TableHead>Phone</TableHead>
					<TableHead>viber</TableHead>
					<TableHead>FB account</TableHead>
					<TableHead>Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each [{ id: 1, name: 'Acme Corp', address: '123 Main St, Springfield', phone: '0917-123-4567', viber: '0917-123-4567', fb: 'acme.corp' }, { id: 2, name: 'Beta Solutions', address: '456 Elm St, Shelbyville', phone: '0922-987-6543', viber: '0922-987-6543', fb: 'betasolutions' }, { id: 3, name: 'Gamma Industries', address: '789 Oak Ave, Capital City', phone: '0933-555-1212', viber: '0933-555-1212', fb: 'gamma.industries' }] as client (client.id)}
					<TableRow>
						<TableCell>{client.name}</TableCell>
						<TableCell>{client.address}</TableCell>
						<TableCell>{client.phone}</TableCell>
						<TableCell>{client.viber}</TableCell>
						<TableCell>{client.fb}</TableCell>
						<TableCell>
							<Button size="icon-sm" variant="ghost">
								<Ellipsis />
							</Button>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</CardContent>
</Card>
