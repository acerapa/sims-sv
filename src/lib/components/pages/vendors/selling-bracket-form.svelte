<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import {
		Sheet,
		SheetContent,
		SheetDescription,
		SheetTitle,
		SheetTrigger
	} from '$lib/components/ui/sheet';
	import SheetFooter from '$lib/components/ui/sheet/sheet-footer.svelte';
	import SheetHeader from '$lib/components/ui/sheet/sheet-header.svelte';
	import { Plus } from '@lucide/svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';

	let { open = $bindable(false), hasTrigger = $bindable(false) } = $props();

	const handleFormClose = (state: boolean) => {
		// TODO: clear form states
	};

	const formEnhance: SubmitFunction = async () => {
		return async ({ result }) => {
			await applyAction(result);
			if (result.type === 'success') {
				toast.success('Selling bracket added successfully');
				await invalidateAll();
				open = false;
			} else {
				const message = result.type === 'failure' ? result.data?.message : null;
				toast.error(message || 'Failed to add selling bracket');
			}
		};
	};
</script>

<Sheet bind:open onOpenChangeComplete={handleFormClose}>
	{#if hasTrigger}
		<SheetTrigger
			class="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
		>
			<Plus class="size-4" />
			Add Selling Bracket
		</SheetTrigger>
	{/if}

	<SheetContent
		trapFocus={false}
		side="right"
		class="overflow-x-hidden overflow-y-auto sm:!max-w-2xl"
	>
		<SheetHeader class="mt-5 flex-row items-center justify-between">
			<div class="space-y-1">
				<SheetTitle>Add New Selling Bracket</SheetTitle>
				<SheetDescription>Fill in the details to add a new selling bracket</SheetDescription>
			</div>
		</SheetHeader>
		<form method="post" action="/settings?/addOneSellingBracket" use:enhance={formEnhance}>
			<div class="flex flex-col gap-6 px-6">
				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="start_price">Start Price</Label>
						<Input name="start_price" id="start_price" type="number" min="0" />
					</div>
					<div class="space-y-2">
						<Label for="end_price">End Price</Label>
						<Input name="end_price" id="end_price" type="number" min="0" />
					</div>
					<div class="space-y-2">
						<Label for="discount_percentage">Discount Percentage</Label>
						<Input name="discount_percentage" id="discount_percentage" type="number" min="0" />
					</div>
				</div>
			</div>
			<SheetFooter class="flex flex-row justify-end">
				<Button
					type="button"
					onclick={() => {
						open = false;
					}}
					variant="outline">Cancel</Button
				>
				<Button type="submit" variant="default">Add Selling Bracket</Button>
			</SheetFooter>
		</form>
	</SheetContent>
</Sheet>
