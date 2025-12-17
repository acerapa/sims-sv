<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
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
	import { Textarea } from '$lib/components/ui/textarea';
	import { Plus } from '@lucide/svelte';
	import RMAItems from './RMAItems.svelte';

	const suppliers = $derived(page.data.suppliers);
	const errors = $derived(page.form?.errors);
	let supplierId = $state('');
	const selectedSupplier = $derived(
		suppliers.find((supplier) => supplier.id === parseInt(supplierId))
	);

	let { open = $bindable(false) } = $props();
</script>

<Sheet bind:open>
	<SheetTrigger class={[buttonVariants({ variant: 'default' })]}>
		<Plus />
		Add RMA
	</SheetTrigger>
	<SheetContent side="right" class="overflow-x-hidden overflow-y-auto sm:!max-w-2xl">
		<SheetHeader>
			<SheetTitle>New Return Merchandise Authorization</SheetTitle>
			<SheetDescription>Fill in the details to add a new rma</SheetDescription>
		</SheetHeader>

		<form action="/vendors/transfers/strs?/createStr" method="post" use:enhance>
			<div class="flex flex-col gap-6 px-6">
				<Card>
					<CardHeader>
						<CardTitle>RMA Information</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex flex-col gap-6">
							<div class="space-y-2">
								<Label>Supplier</Label>
								<div>
									<Select type="single" name="supplier_id" bind:value={supplierId}>
										<SelectTrigger
											class={['w-full', errors?.properties?.supplier_id ? 'border-red-500' : '']}
										>
											{selectedSupplier ? selectedSupplier.name : 'Select Supplier'}
										</SelectTrigger>
										<SelectContent>
											{#each suppliers as supplier (supplier.id)}
												<SelectItem value={supplier.id}>{supplier.name}</SelectItem>
											{/each}
										</SelectContent>
									</Select>
									{#if errors?.properties?.supplier_id}
										<small class="text-red-500">{errors.properties.supplier_id.errors[0]}</small>
									{/if}
								</div>
							</div>
							<div class="space-y-2">
								<Label>Transfer date</Label>
								<div>
									<DatePicker
										error={errors?.properties?.returned_date ? true : false}
										name="returned_date"
									/>
									{#if errors?.properties?.returned_date}
										<small class="text-red-500">
											{errors.properties.returned_date.errors[0]}
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
				<RMAItems />
			</div>
			<SheetFooter class="flex-row justify-end">
				<SheetClose type="button" class={buttonVariants({ variant: 'outline' })}>Cancel</SheetClose>
				<Button type="submit" variant="default">Add RMA</Button>
			</SheetFooter>
		</form>
	</SheetContent>
</Sheet>
