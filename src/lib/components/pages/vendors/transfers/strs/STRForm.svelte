<script lang="ts">
	import DatePicker from '$lib/components/common/DatePicker.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import {
		Sheet,
		SheetClose,
		SheetContent,
		SheetDescription,
		SheetFooter,
		SheetHeader,
		SheetTitle,
		SheetTrigger
	} from '$lib/components/ui/sheet';
	import { Plus } from '@lucide/svelte';
	import STRItems from './STRItems.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { applyAction, enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';

	let { stores, form = null, open = $bindable(false) } = $props();
	let storeId = $state('');
	let selectedStore = $derived.by(() => stores.find((store) => store.id === parseInt(storeId)));
	let errors = $derived(form?.errors);

	const enhanceForm: SubmitFunction = async () => {
		return async ({ result }) => {
			await applyAction(result);
			if (result.type === 'success') {
				await invalidateAll();
				toast.success('STR created successfully');
				open = false;
			} else {
				toast.error('Failed to create STR');
			}
		};
	};

	const onOpenChangeComplete = (state: boolean) => {
		if (!state) {
			storeId = '';
			errors = null;
		}
	};
</script>

<Sheet bind:open {onOpenChangeComplete}>
	<SheetTrigger class={[buttonVariants({ variant: 'default' })]}>
		<Plus />
		Add STR
	</SheetTrigger>
	<SheetContent side="right" class="overflow-x-hidden overflow-y-auto sm:!max-w-2xl">
		<SheetHeader>
			<SheetTitle>New Stock Transfer Request</SheetTitle>
			<SheetDescription>Fill in the details to add a new str</SheetDescription>
		</SheetHeader>

		<form action="/vendors/transfers/strs?/createStr" method="post" use:enhance={enhanceForm}>
			<div class="flex flex-col gap-6 px-6">
				<Card>
					<CardHeader>
						<CardTitle>STR Information</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex flex-col gap-6">
							<div class="space-y-2">
								<Label>Destination</Label>
								<div>
									<Select type="single" name="store_id" bind:value={storeId}>
										<SelectTrigger
											class={['w-full', errors?.properties?.store_id ? 'border-red-500' : '']}
										>
											{selectedStore ? selectedStore.name : 'Select Store'}
										</SelectTrigger>
										<SelectContent>
											{#each stores as store (store.id)}
												<SelectItem value={store.id}>{store.name}</SelectItem>
											{/each}
										</SelectContent>
									</Select>
									{#if errors?.properties?.store_id}
										<small class="text-red-500">{errors.properties.store_id.errors[0]}</small>
									{/if}
								</div>
							</div>
							<div class="space-y-2">
								<Label>Transfer date</Label>
								<div>
									<DatePicker
										error={errors?.properties?.transfer_date ? true : false}
										name="transfer_date"
									/>
									{#if errors?.properties?.transfer_date}
										<small class="text-red-500">
											{errors.properties.transfer_date.errors[0]}
										</small>
									{/if}
								</div>
							</div>
							<div class="space-y-2">
								<Label>Notes</Label>
								<Textarea
									name="notes"
									placeholder="Add any additional notes about this transfer..."
								/>
							</div>
						</div>
					</CardContent>
				</Card>
				<STRItems />
			</div>
			<SheetFooter class="flex-row justify-end">
				<SheetClose type="button" class={buttonVariants({ variant: 'outline' })}>Cancel</SheetClose>
				<Button type="submit" variant="default">Add STR</Button>
			</SheetFooter>
		</form>
	</SheetContent>
</Sheet>
