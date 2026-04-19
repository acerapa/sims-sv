<script lang="ts">
	import SortableTableHead from '$lib/components/common/SortableTableHead.svelte';
	import TablePagination from '$lib/components/common/TablePagination.svelte';
	import PackageForm from '$lib/components/pages/vendors/packages/package-form.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
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
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { Ellipsis, Eye, Search, Trash2 } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import { goto, invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { data, form }: PageProps = $props();

	let packagesList = $derived(data.packages);
	let pkg = $derived(data.package);
	let total = $derived(data.total);
	let currentPage = $derived(data.page);
	let limit = $derived(data.limit);
	let totalPages = $derived(data.totalPages);
	let currentParams = $derived(data.currentParams);

	let productsForForm = $derived(
		data.products.map((p: any) => ({
			id: p.id,
			sku: p.sku,
			sales_description: p.sales_description
		}))
	);

	let openPackageForm = $state(false);
	let searchValue = $state(data.currentParams.search);
	let searchTimeout: ReturnType<typeof setTimeout>;

	function updateSearchParams(updates: Record<string, string | number | null>) {
		const params = new URLSearchParams(page.url.searchParams);
		for (const [key, value] of Object.entries(updates)) {
			if (value === null || value === '') {
				params.delete(key);
			} else {
				params.set(key, String(value));
			}
		}
		if ('search' in updates || 'sort' in updates) {
			params.set('page', '1');
		}
		goto(`?${params.toString()}`, { replaceState: true, keepFocus: true });
	}

	function handleSort(column: string) {
		const newOrder =
			currentParams.sortBy === column && currentParams.sortOrder === 'asc' ? 'desc' : 'asc';
		updateSearchParams({ sort: column, order: newOrder });
	}

	function handleSearch(event: Event) {
		const value = (event.target as HTMLInputElement).value;
		searchValue = value;
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			updateSearchParams({ search: value || null });
		}, 300);
	}

	const handlePageChange = (newPage: number) => updateSearchParams({ page: newPage });
	const handleLimitChange = (newLimit: number) =>
		updateSearchParams({ limit: newLimit, page: 1 });

	const onView = async (packageId: number) => {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('id', String(packageId));
		await goto(`?${params.toString()}`);
		openPackageForm = true;
	};

	let deleteFormEl = $state<HTMLFormElement | null>(null);
	let pendingDeleteId = $state<number | null>(null);

	const onDelete = (packageId: number) => {
		if (!confirm('Delete this package? This cannot be undone.')) return;
		pendingDeleteId = packageId;
		deleteFormEl?.requestSubmit();
	};

	const submitDelete: SubmitFunction = () => {
		return async ({ result }) => {
			await applyAction(result);
			if (result.type === 'success') {
				toast.success('Package deleted successfully');
				await invalidate('vendors:packages');
			} else {
				const message = result.type === 'failure' ? result.data?.message : null;
				toast.error(message || 'Failed to delete package');
			}
			pendingDeleteId = null;
		};
	};
</script>

<svelte:head>
	<title>RamTech | Packages</title>
	<meta name="description" content="Manage product packages" />
</svelte:head>

<form
	bind:this={deleteFormEl}
	action="?/deletePackage"
	method="post"
	use:enhance={submitDelete}
	class="hidden"
>
	<input type="hidden" name="id" value={pendingDeleteId ?? ''} />
</form>

<div class="flex flex-col gap-6">
	<Card>
		<CardHeader class="flex items-center justify-between">
			<div class="space-y-1">
				<CardTitle class="text-lg">Package Management</CardTitle>
				<CardDescription>Create product bundles that can be added to sales orders</CardDescription>
			</div>
			<div class="flex space-x-3">
				<PackageForm
					bind:open={openPackageForm}
					{pkg}
					{form}
					products={productsForForm}
				/>
			</div>
		</CardHeader>
		<CardContent class="flex flex-col gap-4">
			<div class="relative">
				<Input
					type="search"
					class="h-10 pl-9"
					placeholder="Search by package name or description..."
					value={searchValue}
					oninput={handleSearch}
				/>
				<Search class="absolute top-1/2 left-3 size-4 translate-y-[-50%] text-muted-foreground" />
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<SortableTableHead
							column="name"
							label="Name"
							currentSort={currentParams.sortBy}
							currentOrder={currentParams.sortOrder}
							onSort={handleSort}
						/>
						<TableHead>Description</TableHead>
						<TableHead>Products</TableHead>
						<TableHead class="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if packagesList.length === 0}
						<TableRow>
							<TableCell colspan={4} class="h-24 text-center text-muted-foreground">
								No packages found.
							</TableCell>
						</TableRow>
					{:else}
						{#each packagesList as p (p.id)}
							<TableRow>
								<TableCell class="font-medium">{p.name}</TableCell>
								<TableCell class="text-muted-foreground">
									{p.description || '—'}
								</TableCell>
								<TableCell>
									{p.packagesToProducts.length} item{p.packagesToProducts.length === 1 ? '' : 's'}
								</TableCell>
								<TableCell class="text-right">
									<DropdownMenu>
										<DropdownMenuTrigger
											class={buttonVariants({ variant: 'ghost', size: 'icon' })}
										>
											<Ellipsis class="size-4" />
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem onSelect={() => onView(p.id)} class="space-x-2">
												<Eye class="size-4" />
												<span>View</span>
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onSelect={() => onDelete(p.id)}
												class="space-x-2 text-red-500"
											>
												<Trash2 class="size-4" />
												<span>Delete</span>
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						{/each}
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
</div>
