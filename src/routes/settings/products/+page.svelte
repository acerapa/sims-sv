<script lang="ts">
	import PageTitle from '$lib/components/layout/PageTitle.svelte';
	import SortableTableHead from '$lib/components/common/SortableTableHead.svelte';
	import TablePagination from '$lib/components/common/TablePagination.svelte';
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
	import { Check, Loader2, RotateCcw, Save, Search } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { goto, invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';

	let { data, form }: PageProps = $props();

	let products = $derived(data.products);
	let total = $derived(data.total);
	let currentPage = $derived(data.page);
	let limit = $derived(data.limit);
	let totalPages = $derived(data.totalPages);
	let currentParams = $derived(data.currentParams);

	let searchValue = $state(data.currentParams.search);
	let searchTimeout: ReturnType<typeof setTimeout>;

	// Working copy of quantities, keyed by product id
	let edited = $state<Record<number, number>>({});
	let saving = $state(false);

	// Initialize / refresh the working copy when server data changes
	$effect(() => {
		const next: Record<number, number> = {};
		for (const p of products) next[p.id] = p.quantity ?? 0;
		edited = next;
	});

	const original = $derived.by(() => {
		const map: Record<number, number> = {};
		for (const p of products) map[p.id] = p.quantity ?? 0;
		return map;
	});

	const changedUpdates = $derived(
		Object.keys(edited)
			.map(Number)
			.filter((id) => edited[id] !== original[id])
			.map((id) => ({ product_id: id, quantity: edited[id] }))
	);

	function updateSearchParams(updates: Record<string, string | number | null>) {
		const params = new URLSearchParams(page.url.searchParams);
		for (const [key, value] of Object.entries(updates)) {
			if (value === null || value === '') params.delete(key);
			else params.set(key, String(value));
		}
		if ('search' in updates || 'sort' in updates) params.set('page', '1');
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
		searchTimeout = setTimeout(() => updateSearchParams({ search: value || null }), 300);
	}

	const handlePageChange = (newPage: number) => updateSearchParams({ page: newPage });
	const handleLimitChange = (newLimit: number) =>
		updateSearchParams({ limit: newLimit, page: 1 });

	function resetAll() {
		for (const p of products) edited[p.id] = p.quantity ?? 0;
	}

	const submitForm: SubmitFunction = () => {
		saving = true;
		return async ({ result }) => {
			saving = false;
			await applyAction(result);
			if (result.type === 'success') {
				toast.success(`Saved ${result.data?.count ?? 0} product(s)`);
				await invalidate('settings:products');
			} else {
				const message =
					result.type === 'failure' ? (result.data?.message as string | undefined) : null;
				toast.error(message || 'Failed to save changes');
			}
		};
	};
</script>

<svelte:head>
	<title>RamTech | Settings - Product</title>
	<meta name="description" content="RamTech Products Management" />
</svelte:head>

<section class="flex flex-col gap-8">
	<PageTitle
		title="Product On-Hand Quantity"
		subTitle="Edit quantities directly. Click Save Changes to commit all edits at once."
	/>

	<form method="post" action="?/updateQuantities" use:enhance={submitForm}>
		{#each changedUpdates as update, i (update.product_id)}
			<input type="hidden" name={`updates.${i}.product_id`} value={update.product_id} />
			<input type="hidden" name={`updates.${i}.quantity`} value={update.quantity} />
		{/each}
		<Card>
			<CardHeader>
				<div class="flex items-start justify-between gap-4">
					<div class="space-y-1">
						<CardTitle>Products</CardTitle>
						<CardDescription>
							Modify any on-hand quantity. Unsaved edits are highlighted.
						</CardDescription>
					</div>
					<div class="flex items-center gap-2">
						{#if changedUpdates.length > 0}
							<span class="text-sm text-muted-foreground">
								{changedUpdates.length} unsaved change{changedUpdates.length === 1 ? '' : 's'}
							</span>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onclick={resetAll}
								disabled={saving}
							>
								<RotateCcw class="size-4" />
								Reset
							</Button>
						{/if}
						<Button type="submit" disabled={saving || changedUpdates.length === 0}>
							{#if saving}
								<Loader2 class="size-4 animate-spin" />
							{:else}
								<Save class="size-4" />
							{/if}
							Save Changes
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent class="flex flex-col gap-4">
				<div class="relative">
					<Input
						type="search"
						class="h-10 pl-9"
						placeholder="Search by SKU or description..."
						value={searchValue}
						oninput={handleSearch}
					/>
					<Search
						class="absolute top-1/2 left-3 size-4 translate-y-[-50%] text-muted-foreground"
					/>
				</div>

				<Table>
					<TableHeader>
						<TableRow>
							<SortableTableHead
								column="purchase_description"
								label="Product"
								currentSort={currentParams.sortBy}
								currentOrder={currentParams.sortOrder}
								onSort={handleSort}
							/>
							<SortableTableHead
								column="sku"
								label="SKU"
								currentSort={currentParams.sortBy}
								currentOrder={currentParams.sortOrder}
								onSort={handleSort}
							/>
							<SortableTableHead
								column="quantity"
								label="On-Hand"
								currentSort={currentParams.sortBy}
								currentOrder={currentParams.sortOrder}
								onSort={handleSort}
							/>
							<TableHead>New Quantity</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#if products.length === 0}
							<TableRow>
								<TableCell colspan={4} class="h-24 text-center text-muted-foreground">
									No products found.
								</TableCell>
							</TableRow>
						{:else}
							{#each products as product (product.id)}
								{@const isChanged = edited[product.id] !== original[product.id]}
								<TableRow>
									<TableCell class="font-medium">{product.purchase_description}</TableCell>
									<TableCell class="text-muted-foreground">{product.sku}</TableCell>
									<TableCell class="font-semibold">{product.quantity ?? 0}</TableCell>
									<TableCell>
										<Input
											type="number"
											min="0"
											class={[
												'h-9 max-w-28',
												isChanged ? 'border-blue-500 ring-1 ring-blue-200' : ''
											]}
											bind:value={edited[product.id]}
										/>
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
	</form>
</section>
