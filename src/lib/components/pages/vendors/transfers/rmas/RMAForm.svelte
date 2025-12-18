<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
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
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { open = $bindable(false) } = $props();
	const suppliers = $derived(page.data.suppliers);
	const errors = $derived(page.form?.errors);
	let supplierId = $state('');
	const selectedSupplier = $derived(
		suppliers.find((supplier) => supplier.id === parseInt(supplierId))
	);

	const handleSupplierIdChange = async (value: string) => {
		if (value) {
			await goto(
				resolve(`/vendors/transfers/rmas?supplier_id=${value}` as '/vendors/transfers/rmas')
			);
		}
	};

	const enhanceForm: SubmitFunction = () => {
		return async ({ result }) => {
			await applyAction(result);
			if (result.type === 'success') {
				toast.success('RMA created successfully!');
				open = false;
			} else {
				toast.error('Failed to create RMA!');
			}
		};
	};

	const onOpenChangeComplete = (isOpen: boolean) => {
		if (!isOpen) {
			goto(resolve('/vendors/transfers/rmas'));
		}
	};
</script>

<Sheet bind:open {onOpenChangeComplete}>
	<SheetTrigger class={[buttonVariants({ variant: 'default' })]}>
		<Plus />
		Add RMA
	</SheetTrigger>
	<SheetContent side="right" class="overflow-x-hidden overflow-y-auto sm:!max-w-2xl">
		<SheetHeader>
			<SheetTitle>New Return Merchandise Authorization</SheetTitle>
			<SheetDescription>Fill in the details to add a new rma</SheetDescription>
		</SheetHeader>

		<form action="/vendors/transfers/rmas?/createRMA" method="post" use:enhance={enhanceForm}>
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
									<Select
										onValueChange={handleSupplierIdChange}
										type="single"
										name="supplier_id"
										bind:value={supplierId}
									>
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
										error={errors?.properties?.date_returned ? true : false}
										name="date_returned"
									/>
									{#if errors?.properties?.date_returned}
										<small class="text-red-500">
											{errors.properties.date_returned.errors[0]}
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
