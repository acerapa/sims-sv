<script lang="ts">
	import { page } from '$app/state';
	import DatePicker from '$lib/components/common/DatePicker.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
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
	import { Textarea } from '$lib/components/ui/textarea';
	import { Plus } from '@lucide/svelte';
	import IBRRItems from './IBRRItems.svelte';

	let { open = $bindable(false) } = $props();

	let storeId = $state('');

	const stores = $derived(page.data.stores);
	const selectedStore = $derived.by(() => stores.find((store) => store.id === parseInt(storeId)));
	let errors = $derived(page.form?.errors);

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
		Add IBRR
	</SheetTrigger>
	<SheetContent side="right" class="overflow-x-hidden overflow-y-auto sm:!max-w-2xl">
		<SheetHeader>
			<SheetTitle>New Inter-Branch Receiving Report</SheetTitle>
			<SheetDescription>Fill in the details to add a new ibrr</SheetDescription>
		</SheetHeader>

		<form method="post" action="">
			<div class="flex flex-col gap-6 px-6">
				<Card>
					<CardHeader>
						<CardTitle>IBRR Information</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex flex-col gap-6">
							<div class="space-y-2">
								<Label>Source Store</Label>
								<div>
									<Select type="single" name="source_store_id" bind:value={storeId}>
										<SelectTrigger
											class={[
												'w-full',
												errors?.properties?.source_store_id ? 'border-red-500' : ''
											]}
										>
											{selectedStore ? selectedStore.name : 'Select Store'}
										</SelectTrigger>
										<SelectContent>
											{#each stores as store (store.id)}
												<SelectItem value={store.id}>{store.name}</SelectItem>
											{/each}
										</SelectContent>
									</Select>
									{#if errors?.properties?.source_store_id}
										<small class="text-red-500">
											{errors.properties.source_store_id.errors[0]}
										</small>
									{/if}
								</div>
							</div>
							<div class="space-y-2">
								<Label>Received Date</Label>
								<div>
									<DatePicker
										error={errors?.properties?.received_date ? true : false}
										name="received_date"
									/>
									{#if errors?.properties?.received_date}
										<small class="text-red-500">
											{errors.properties.received_date.errors[0]}
										</small>
									{/if}
								</div>
							</div>
							<div class="space-y-2">
								<Label>STR Reference</Label>
								<div>
									<Input
										class={[errors?.properties?.str_id ? 'border-red-500' : '']}
										name="str_id"
										placeholder="Enter STR Reference"
									/>
									{#if errors?.properties?.str_id}
										<small class="text-red-500">{errors.properties.str_id.errors[0]}</small>
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
				<IBRRItems />
			</div>
			<SheetFooter class="flex-row justify-end">
				<SheetClose type="button" class={buttonVariants({ variant: 'outline' })}>Cancel</SheetClose>
				<Button type="submit" variant="default">Add IBRR</Button>
			</SheetFooter>
		</form>
	</SheetContent>
</Sheet>
