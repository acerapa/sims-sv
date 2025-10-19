<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import {
		Drawer,
		DrawerContent,
		DrawerDescription,
		DrawerHeader,
		DrawerTitle
	} from '$lib/components/ui/drawer';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import SelectCategory from './SelectCategory.svelte';

	let { open = $bindable() } = $props();
</script>

<Drawer direction="right" bind:open>
	<DrawerContent class="sm:!max-w-2xl" draggable={false}>
		<DrawerHeader class="px-6">
			<DrawerTitle>Product Form</DrawerTitle>
			<DrawerDescription>This is a product form.</DrawerDescription>
		</DrawerHeader>
		<div class="flex flex-col gap-4 px-6">
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
		</div>
	</DrawerContent>
</Drawer>
