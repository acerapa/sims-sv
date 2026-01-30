<script lang="ts">
	import StatCard from '$lib/components/common/StatCard.svelte';
	import ProductForm from '$lib/components/pages/vendors/product-form.svelte';
	import ProductRow from '$lib/components/pages/vendors/ProductRow.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Funnel, Package, Search, TrendingDown, TriangleAlert } from '@lucide/svelte';
	import { setContext } from 'svelte';
	import type { PageProps } from './$types';
	import type { Category, Supplier } from '$lib/types/global';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { data, form }: PageProps = $props();
	let categories = $derived<Category[]>(data.categories);
	let suppliers = $derived<Supplier[]>(data.suppliers);
	let products = $derived(data.products);
	let product = $derived(data.product);
	let openProductForm = $state(false);
	let preSelectedSuppliers = $state<{ supplierId: number | null; cost: string | null }[]>([]);

	let onEditOrView = async (productId: number) => {
		await goto(resolve(`/vendors/inventory?id=${productId}` as '/vendors/inventory'));
		preSelectedSuppliers = product?.suppliers || [];
		openProductForm = true;
	};

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
				<Input type="search" class="h-10 pl-9" placeholder="Search products..." />
				<Search class="absolute top-1/2 left-3 size-4 translate-y-[-50%] text-muted-foreground" />
			</div>

			<div class="flex flex-col gap-3">
				{#each products as product (product.id)}
					<ProductRow oneditorview={onEditOrView} {product} />
				{/each}
			</div>
		</CardContent>
	</Card>
</div>
