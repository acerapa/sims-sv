<script lang="ts">
	import { page } from '$app/state';
	import ClientForm from '$lib/components/pages/customers/clients/client-form.svelte';
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

	const customers = $derived(page.data.customers);
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
			<ClientForm />
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
				{#each customers as client (client.id)}
					<TableRow>
						<TableCell>{client.name}</TableCell>
						<TableCell>{client.address || '-'}</TableCell>
						<TableCell>{client.phone || '-'}</TableCell>
						<TableCell>{client.viber || '-'}</TableCell>
						<TableCell>{client.fb || '-'}</TableCell>
						<TableCell>
							<Button size="icon-sm" variant="ghost">
								<Ellipsis />
							</Button>
						</TableCell>
					</TableRow>
				{/each}
				{#if customers?.length === 0}
					<TableRow>
						<TableCell colspan={6} class="text-center">No clients found</TableCell>
					</TableRow>
				{/if}
			</TableBody>
		</Table>
	</CardContent>
</Card>
