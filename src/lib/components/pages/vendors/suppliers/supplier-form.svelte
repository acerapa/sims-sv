<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
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
	import type { Supplier } from '$lib/types/global';
	import { Plus } from '@lucide/svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';

	let {
		supplier = null,
		insertedSupplier = $bindable<Supplier | null>(null),
		hasTrigger = $bindable<boolean>(true),
		open = $bindable<boolean>(false),
		onSuccess = $bindable<(supplierId: number) => void>(() => {})
	}: {
		supplier?: Supplier | null;
		insertedSupplier?: Supplier | null;
		hasTrigger?: boolean;
		open?: boolean;
		onSuccess?: (supplierId: number) => void;
	} = $props();
	let errors = $derived(page.form?.errors);
	const isView = $derived(!!supplier);

	const formEnhance: SubmitFunction = async () => {
		return async ({ result }) => {
			await applyAction(result);
			if (result.type === 'success') {
				open = false;
				insertedSupplier = result.data ? result.data[0] : null;
				await invalidateAll();
				onSuccess(result.data ? result.data[0].id : 0);
				toast.success('Supplier added successfully');
			} else {
				toast.error('Failed to add supplier');
			}
		};
	};

	$effect(() => {
		if (!open) {
			if (errors) {
				errors = null;
			}
		}
	});
</script>

<Sheet bind:open>
	{#if hasTrigger}
		<SheetTrigger
			class="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
		>
			<Plus class="size-4" />
			Add Supplier
		</SheetTrigger>
	{/if}
	<SheetContent side="right" class="overflow-x-hidden overflow-y-auto sm:!max-w-2xl">
		<SheetHeader>
			<SheetTitle>{isView ? 'View Supplier' : 'Add New Supplier'}</SheetTitle>
			<SheetDescription>
				{isView ? 'Supplier details' : 'Fill in the details to add a new supplier'}
			</SheetDescription>
		</SheetHeader>
		<form method="post" action="/vendors/suppliers" use:enhance={formEnhance}>
			<div class="flex flex-col gap-6 px-6">
				<Card>
					<CardHeader>
						<CardTitle>Basic Information</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="space-y-2">
							<Label for="name">Supplier Name</Label>
							<div>
								<Input
									disabled={isView}
									value={supplier?.name ?? ''}
									class={['disabled:opacity-100', errors?.properties?.name ? 'border-red-500' : '']}
									id="name"
									name="name"
									type="text"
									placeholder="Enter Supplier Name"
								/>
								{#if errors?.properties?.name}
									<small class="text-red-500">{errors.properties.name.errors[0]}</small>
								{/if}
							</div>
						</div>
						<div class="space-y-2">
							<Label for="contact_person">Contact Person</Label>
							<div>
								<Input
									disabled={isView}
									value={supplier?.contact_person ?? ''}
									class={[
										'disabled:opacity-100',
										errors?.properties?.contact_person ? 'border-red-500' : ''
									]}
									id="contact_person"
									name="contact_person"
									type="text"
									placeholder="Enter Contact Person"
								/>
								{#if errors?.properties?.contact_person}
									<small class="text-red-500">{errors.properties.contact_person.errors[0]}</small>
								{/if}
							</div>
						</div>
						<div class="space-y-2">
							<Label for="address">Address</Label>
							<div>
								<Textarea
									disabled={isView}
									value={supplier?.address ?? ''}
									class={[
										'disabled:opacity-100',
										errors?.properties?.address ? 'border-red-500' : ''
									]}
									id="address"
									name="address"
									placeholder="Enter address"
								/>
								{#if errors?.properties?.address}
									<small class="text-red-500">{errors.properties.address.errors[0]}</small>
								{/if}
							</div>
						</div>
						<div class="space-y-2">
							<Label for="notes">Notes</Label>
							<div>
								<Textarea
									disabled={isView}
									value={supplier?.notes ?? ''}
									class={[
										'disabled:opacity-100',
										errors?.properties?.notes ? 'border-red-500' : ''
									]}
									id="notes"
									name="notes"
									placeholder="Enter notes"
								/>
								{#if errors?.properties?.notes}
									<small class="text-red-500">{errors.properties.notes.errors[0]}</small>
								{/if}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Contact Information</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="space-y-2">
							<Label for="email">Email</Label>
							<div>
								<Input
									disabled={isView}
									value={supplier?.email ?? ''}
									class={[
										'disabled:opacity-100',
										errors?.properties?.email ? 'border-red-500' : ''
									]}
									id="email"
									name="email"
									type="email"
									placeholder="email@example.com"
								/>
								{#if errors?.properties?.email}
									<small class="text-red-500">{errors.properties.email.errors[0]}</small>
								{/if}
							</div>
						</div>
						<div class="space-y-2">
							<Label for="phone">Phone</Label>
							<div>
								<Input
									disabled={isView}
									value={supplier?.phone_number ?? ''}
									class={[
										'disabled:opacity-100',
										errors?.properties?.phone_number ? 'border-red-500' : ''
									]}
									id="phone"
									name="phone_number"
									type="text"
									placeholder="+63 "
								/>
								{#if errors?.properties?.phone_number}
									<small class="text-red-500">{errors.properties.phone_number.errors[0]}</small>
								{/if}
							</div>
						</div>
						<div class="space-y-2">
							<Label for="telephone">Telephone</Label>
							<div>
								<Input
									disabled={isView}
									value={supplier?.telephone_number ?? ''}
									class={[
										'disabled:opacity-100',
										errors?.properties?.telephone_number ? 'border-red-500' : ''
									]}
									id="telephone"
									name="telephone_number"
									type="text"
									placeholder="(655) 123-4567"
								/>
								{#if errors?.properties?.telephone_number}
									<small class="text-red-500">{errors.properties.telephone_number.errors[0]}</small>
								{/if}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
			{#if !isView}
				<SheetFooter class="flex flex-row justify-end">
					<SheetClose type="button">
						<Button type="button" variant="outline">Cancel</Button>
					</SheetClose>
					<Button type="submit" variant="default">Add Supplier</Button>
				</SheetFooter>
			{/if}
		</form>
	</SheetContent>
</Sheet>
