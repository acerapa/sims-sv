<script lang="ts">
	import { page } from '$app/state';
	import ClientForm from '#lib/components/pages/customers/clients/client-form.svelte';
	import { Button } from '#lib/components/ui/button/index.ts';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '#lib/components/ui/card/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/table/index.ts';
	import { Ellipsis, Search } from '@lucide/svelte';
	import TablePagination from '#lib/components/common/TablePagination.svelte';
	import { paginatedParamsUpdate } from '#lib/utils/pagination.ts';

	const customers = $derived(page.data.paginated.data);

	// Pagination related variables
	let total = $derived(page.data.paginated.total);
	let currentPage = $derived(page.data.paginated.page);
	let limit = $derived(page.data.paginated.limit);
	let totalPages = $derived(page.data.paginated.totalPages);

	const handlePageChange = (page: number) => {
		paginatedParamsUpdate({ page });
	};
	const handleLimitChange = (newLimit: number) => {
		paginatedParamsUpdate({ limit: newLimit, page: 1 });
	};
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
						<TableCell>{client.fb_account || '-'}</TableCell>
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

		<TablePagination
			page={currentPage}
			{totalPages}
			{total}
			{limit}
			onPageChange={handlePageChange}
			onLimitChange={handleLimitChange}
		/>
	</CardContent>
</Card>
