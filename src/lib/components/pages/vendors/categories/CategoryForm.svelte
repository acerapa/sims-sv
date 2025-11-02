<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import {
		Sheet,
		SheetContent,
		SheetDescription,
		SheetFooter,
		SheetHeader,
		SheetTitle,
		SheetTrigger
	} from '$lib/components/ui/sheet';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Plus } from '@lucide/svelte';

	let open = $state(false);
</script>

<Sheet bind:open>
	<SheetTrigger
		class="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
	>
		<Plus class="size-4" />
		Add Category
	</SheetTrigger>
	<SheetContent side="right" class="sm:!max-w-2xl">
		<SheetHeader>
			<SheetTitle>Add New Category</SheetTitle>
			<SheetDescription>
				Create a new product category. Categories help organize your inventory.
			</SheetDescription>
		</SheetHeader>
		<form action="" method="post" use:enhance>
			<div class="space-y-4 px-4">
				<div class="space-y-2">
					<Label for="name">Category Name</Label>
					<Input id="name" name="name" placeholder="Enter category name" />
				</div>
				<div class="space-y-2">
					<Label for="parent">Parent Category</Label>
					<Select type="single" name="parent">
						<SelectTrigger class="w-full">Select Parent Category</SelectTrigger>
						<SelectContent>
							<SelectItem value="none">None</SelectItem>
							<SelectItem value="computer">Computer</SelectItem>
							<SelectItem value="phone">Phone</SelectItem>
							<SelectItem value="electronics">Electronics</SelectItem>
							<SelectItem value="accessories">Accessories</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div class="space-y-2">
					<Label for="description">Description</Label>
					<Textarea
						id="description"
						name="description"
						placeholder="Breif description of this category"
					/>
				</div>
			</div>
			<SheetFooter class="flex flex-row justify-end gap-3">
				<Button variant="outline">Cancel</Button>
				<Button type="submit">Add Category</Button>
			</SheetFooter>
		</form>
	</SheetContent>
</Sheet>
