<script lang="ts">
	import PageTitle from '$lib/components/layout/PageTitle.svelte';
	import StoresForm from '$lib/components/pages/settings/stores/StoresForm.svelte';
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
	import type { PageProps } from './$types';

	let { form, data }: PageProps = $props();
	const stores = $derived(data.stores);
</script>

<svelte:head>
	<title>RamTech | Stores</title>
	<meta name="description" content="RamTech Stores Management" />
</svelte:head>

<section class="flex flex-col gap-8">
	<PageTitle title="Stores" subTitle="Manage store branches records" />

	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<div class="space-y-2">
					<CardTitle>Stores</CardTitle>
					<CardDescription>Manage your store branches records</CardDescription>
				</div>
				<StoresForm {form} />
			</div>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="relative">
				<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input type="search" placeholder="Search suppliers..." class="h-10 pl-9" />
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Store Name</TableHead>
						<TableHead>Address</TableHead>
						<TableHead>Manager</TableHead>
						<TableHead>Phone</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each stores as store (store.id)}
						<TableRow>
							<TableCell>{store.name}</TableCell>
							<TableCell>{store.address}</TableCell>
							<TableCell>{store.manager}</TableCell>
							<TableCell>{store.phone_number}</TableCell>
							<TableCell>{store.is_active ? 'Active' : 'Inactive'}</TableCell>
							<TableCell>
								<Button variant="ghost" size="sm">
									<Ellipsis />
								</Button>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</CardContent>
	</Card>
</section>
