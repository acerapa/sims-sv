<script lang="ts">
	import StatCard from '$lib/components/common/StatCard.svelte';
	import SortableTableHead from '$lib/components/common/SortableTableHead.svelte';
	import TablePagination from '$lib/components/common/TablePagination.svelte';
	import ProductForm from '$lib/components/pages/vendors/product-form.svelte';
	import ProductBadge from '$lib/components/pages/vendors/ProductBadge.svelte';
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
		DropdownMenuTrigger,
		DropdownMenuSeparator
	} from '$lib/components/ui/dropdown-menu';
	import {
		Funnel,
		Package,
		Search,
		TrendingDown,
		TriangleAlert,
		Ellipsis,
		Eye,
		CirclePause
	} from '@lucide/svelte';
	import { setContext } from 'svelte';
	import type { PageProps } from './$types';
	import type { Category, Supplier } from '$lib/types/global';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { data, form }: PageProps = $props();
	let categories = $derived<Category[]>(data.categories);
	let suppliers = $derived<Supplier[]>(data.suppliers);
	let products = $derived(data.products);
	let product = $derived(data.product);
	let total = $derived(data.total);
	let currentPage = $derived(data.page);
	let limit = $derived(data.limit);
	let totalPages = $derived(data.totalPages);
	let currentParams = $derived(data.currentParams);

	let openProductForm = $state(false);
	let preSelectedSuppliers = $state<{ supplierId: number | null; cost: string | null }[]>([]);
	let searchValue = $state(data.currentParams.search);
	let searchTimeout: ReturnType<typeof setTimeout>;

	function updateSearchParams(updates: Record<string, string | number | null>) {
		const params = new URLSearchParams($page.url.searchParams);

		for (const [key, value] of Object.entries(updates)) {
			if (value === null || value === '') {
				params.delete(key);
			} else {
				params.set(key, String(value));
			}
		}

		// Reset to page 1 when search or sort changes
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

	function handlePageChange(newPage: number) {
		updateSearchParams({ page: newPage });
	}

	function handleLimitChange(newLimit: number) {
		updateSearchParams({ limit: newLimit, page: 1 });
	}

	let onEditOrView = async (productId: number) => {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('id', String(productId));
		await goto(`?${params.toString()}`);
		preSelectedSuppliers = product?.suppliers || [];
		openProductForm = true;
	};

	function getQuantityColor(quantity: number, minimumQuantity: number | null) {
		if (quantity > (minimumQuantity ?? 0)) {
			return 'text-green-500';
		} else if (quantity <= (minimumQuantity ?? 0) && quantity !== 0) {
			return 'text-yellow-500';
		}
		return 'text-red-500';
	}

	setContext('pageTitle', {
		title: 'Inventory',
		subTitle: 'Monitor your product stock levels and inventory status.'
	});

	const statCards = [
		{
			title: 'Total Items',
			value: '2,847',
			icon: Package,
			diff: '+45',
			description: 'this month',
			variant: 'success'
		},
		{
			title: 'Low Stock items',
			value: '12',
			icon: TriangleAlert,
			diff: '+3',
			description: 'this month',
			variant: 'warning'
		},
		{
			title: 'Out of Stock',
			value: '5',
			icon: TrendingDown,
			diff: '-2',
			description: 'this month',
			variant: 'danger'
		},
		{
			title: 'Total Value',
			value: '₱89,432',
			icon: Package,
			diff: '+₱9,432',
			description: 'this month',
			variant: 'success'
		}
	];
</script>

<svelte:head>
	<title>RamTech | Item list</title>
	<meta name="description" content="RamTech Inventory Dashboard" />
</svelte:head>

<div class="flex flex-col gap-6">
	<div class="grid gap-6 lg:grid-cols-4">
		{#each statCards as stat (stat.title)}
			<StatCard
				title={stat.title}
				value={stat.value}
				icon={stat.icon}
				diff={stat.diff}
				description={stat.description}
				variant={stat.variant}
			/>
		{/each}
	</div>
	<Card>
		<CardHeader class="flex items-center justify-between">
			<div class="space-y-1">
				<CardTitle class="text-lg">Inventory Management</CardTitle>
				<CardDescription>Track and manage your product inventory</CardDescription>
			</div>
			<div class="flex space-x-3">
				<Button variant="outline" class="space-x-2">
					<Funnel />
					<span>Filter</span>
				</Button>
				<ProductForm
					bind:open={openProductForm}
					bind:preSelectedSuppliers
					{product}
					{form}
					{suppliers}
					{categories}
				/>
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
				<Search class="absolute top-1/2 left-3 size-4 translate-y-[-50%] text-muted-foreground" />
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
						<TableHead>Category</TableHead>
						<SortableTableHead
							column="sale_price"
							label="Price"
							currentSort={currentParams.sortBy}
							currentOrder={currentParams.sortOrder}
							onSort={handleSort}
						/>
						<SortableTableHead
							column="quantity"
							label="Stock"
							currentSort={currentParams.sortBy}
							currentOrder={currentParams.sortOrder}
							onSort={handleSort}
						/>
						<TableHead>Status</TableHead>
						<TableHead class="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if products.length === 0}
						<TableRow>
							<TableCell colspan={7} class="h-24 text-center text-muted-foreground">
								No products found.
							</TableCell>
						</TableRow>
					{:else}
						{#each products as prod (prod.id)}
							<TableRow>
								<TableCell class="font-medium">{prod.purchase_description}</TableCell>
								<TableCell class="text-muted-foreground">{prod.sku}</TableCell>
								<TableCell>{prod.category.name}</TableCell>
								<TableCell class="font-semibold">
									₱{parseFloat(prod.sale_price || '0').toFixed(2)}
								</TableCell>
								<TableCell>
									<span
										class={['font-bold', getQuantityColor(prod.quantity, prod.minimum_quantity)]}
									>
										{prod.quantity || 0}
									</span>
									<span class="text-muted-foreground">/{prod.minimum_quantity || 0}</span>
								</TableCell>
								<TableCell>
									<ProductBadge
										quantity={prod.quantity || 0}
										minimum_quantity={prod.minimum_quantity || 0}
									/>
								</TableCell>
								<TableCell class="text-right">
									<DropdownMenu>
										<DropdownMenuTrigger class={buttonVariants({ variant: 'ghost', size: 'icon' })}>
											<Ellipsis class="size-4" />
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem onSelect={() => onEditOrView(prod.id)} class="space-x-2">
												<Eye class="size-4" />
												<span>View</span>
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem class="space-x-2 text-muted-foreground">
												<CirclePause class="size-4" />
												<span>Mark as Inactive</span>
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
