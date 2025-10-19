<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import {
		Drawer,
		DrawerContent,
		DrawerDescription,
		DrawerFooter,
		DrawerHeader,
		DrawerTitle
	} from '$lib/components/ui/drawer';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Select,
		SelectContent,
		SelectGroup,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import CostPerSupplier from './CostPerSupplier.svelte';
	import SelectCategory from './SelectCategory.svelte';

	let { open = $bindable() } = $props();

	let suppliers = [
		{ id: 1, name: 'Supplier A' },
		{ id: 2, name: 'Supplier B' },
		{ id: 3, name: 'Supplier C' }
	];

	let selectedSupplier = $state([]);
	let preferredSupplier = $state('');
</script>

<Drawer direction="right" bind:open>
	<DrawerContent
		class="overflow-x-hidden overflow-y-auto sm:!max-w-2xl"
		draggable={false}
		data-vaul-no-drag
	>
		<DrawerHeader class="px-6">
			<DrawerTitle class="text-xl">Add New Product</DrawerTitle>
			<DrawerDescription>
				Fill in the details to add a new product to your inventory
			</DrawerDescription>
		</DrawerHeader>
		<form>
			<div class="flex flex-col gap-6 px-6">
				<Card>
					<CardHeader>
						<CardTitle>Product Details</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex flex-col gap-6">
							<div class="space-y-2">
								<Label>Item Code / SKU</Label>
								<Input type="text" placeholder="e,.g,, WH-2025-0001" />
							</div>
							<div class="space-y-2">
								<Label>Category</Label>
								<SelectCategory />
							</div>
							<div class="space-y-2">
								<Label>Quantity</Label>
								<Input type="number" placeholder="Enter quantity" />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Suppliers</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex flex-col gap-6">
							<div class="space-y-2">
								<Label>Item Code / SKU</Label>
								<Select type="multiple" bind:value={selectedSupplier}>
									<SelectTrigger class="w-full">
										{selectedSupplier.length ? selectedSupplier : 'Select Supplier'}
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{#each suppliers as supplier (supplier.id)}
												<SelectItem value={supplier.id.toString()} label={supplier.name}>
													{supplier.name}
												</SelectItem>
											{/each}
										</SelectGroup>
									</SelectContent>
								</Select>
							</div>
							<div class="space-y-2">
								<Label>Preferred Supplier</Label>
								<Select type="single" bind:value={preferredSupplier}>
									<SelectTrigger class="w-full">
										{preferredSupplier ? preferredSupplier : 'Select Preferred Supplier'}
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{#each suppliers as supplier (supplier.id)}
												<SelectItem value={supplier.id.toString()} label={supplier.name}>
													{supplier.name}
												</SelectItem>
											{/each}
										</SelectGroup>
									</SelectContent>
								</Select>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Descriptions</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex flex-col gap-6">
							<div class="space-y-2">
								<Label>Item Description - Purchase</Label>
								<Textarea placeholder="Description for purchase orders and receiving..." />
							</div>
							<div class="space-y-2">
								<Label>Item Description - Sales</Label>
								<Textarea placeholder="Description for sales and customer-facing documents..." />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Pricing</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex flex-col gap-6">
							<div class="space-y-2">
								<Label>Sale Price</Label>
								<Input type="number" placeholder="Purchase price" />
							</div>
							<CostPerSupplier />
						</div>
					</CardContent>
				</Card>
				<Separator />
			</div>
			<DrawerFooter class="flex flex-row justify-end">
				<Button type="button" variant="outline">Cancel</Button>
				<Button type="button" variant="default">Add Product</Button>
			</DrawerFooter>
		</form>
	</DrawerContent>
</Drawer>
