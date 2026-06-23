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
	import { Plus, Printer } from '@lucide/svelte';
	import STRItems from './STRItems.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { applyAction, enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { goto, invalidateAll } from '$app/navigation';
	import StoresForm from '$lib/components/pages/settings/stores/StoresForm.svelte';
	import { resolve } from '$app/paths';

	let { stores, form = null, open = $bindable(false), str = $bindable(null) } = $props();
	let storeId = $derived(str?.store_id ?? '');
	let transferDate = $derived(str?.transfer_date ?? '');
	let notes = $derived(str?.notes ?? '');
	let selectedStore = $derived.by(() => stores.find((store) => store.id === parseInt(storeId)));
	let errors = $derived(form?.errors);
	let showStoresForm = $state(false);
	let isViewOnly = $derived(str?.id !== undefined);

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
			goto(resolve('/vendors/transfers/strs'));
		}
	};

	const printSTR = async () => {
		await goto(resolve(`/vendors/transfers/strs/print/${str?.id}`));
	};

	const openStoresForm = () => {
		showStoresForm = true;
	};
</script>

<Sheet bind:open {onOpenChangeComplete}>
	<SheetTrigger class={[buttonVariants({ variant: 'default' })]}>
		<Plus />
		Add STR
	</SheetTrigger>
	<SheetContent side="right" class="overflow-x-hidden overflow-y-auto sm:max-w-3xl">
		<SheetHeader>
			<SheetTitle>
				{`${str?.id ? 'View' : 'New'} Stock Transfer Request`}
			</SheetTitle>
			<SheetDescription>
				{str?.id
					? 'View the details of this stock transfer request.'
					: 'Fill in the details to create a new stock transfer request.'}
			</SheetDescription>
		</SheetHeader>

		<form action="/vendors/transfers/strs?/createStr" method="post" use:enhance={enhanceForm}>
			<div class="flex flex-col gap-6 px-6">
				<Card>
					<CardHeader class="flex items-center justify-between">
						<CardTitle>STR Information</CardTitle>
						{#if str?.id}
							<Button type="button" class="cursor-pointer" variant="outline" onclick={printSTR}>
								<Printer size={16} />
								Print
							</Button>
						{/if}
					</CardHeader>
					<CardContent>
						<div class="flex flex-col gap-6">
							<div class="space-y-2">
								<Label>Destination</Label>
								<div>
									<Select disabled={isViewOnly} type="single" name="store_id" bind:value={storeId}>
										<SelectTrigger
											class={['w-full', errors?.properties?.store_id ? 'border-red-500' : '']}
										>
											{selectedStore ? selectedStore.name : 'Select Store'}
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="0" onclick={openStoresForm}>Add Store</SelectItem>
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
										disabled={isViewOnly}
										error={errors?.properties?.transfer_date ? true : false}
										name="transfer_date"
										bind:value={transferDate}
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
									readonly={isViewOnly}
									name="notes"
									bind:value={notes}
									placeholder="Add any additional notes about this transfer..."
								/>
							</div>
						</div>
					</CardContent>
				</Card>
				{#key str?.items}
					<STRItems {isViewOnly} initialItems={str?.items} />
				{/key}
			</div>
			{#if !isViewOnly}
				<SheetFooter class="flex-row justify-end">
					<SheetClose type="button" class={buttonVariants({ variant: 'outline' })}>
						Cancel
					</SheetClose>
					<Button type="submit" variant="default">Add STR</Button>
				</SheetFooter>
			{/if}
		</form>
	</SheetContent>
</Sheet>
<StoresForm hasTrigger={false} bind:open={showStoresForm} />
