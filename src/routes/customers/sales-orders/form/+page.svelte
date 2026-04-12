<script lang="ts">
	import DatePicker from '$lib/components/common/DatePicker.svelte';
	import SelectProduct from '$lib/components/pages/customers/sales-orders/select-product.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import {
		Select,
		SelectContent,
		SelectGroup,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { CustomerWithId, Product } from '$lib/types/global';
	import type { PageProps } from './$types';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { findErrorByKey } from '$lib/utils/common';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ClientForm from '$lib/components/pages/customers/clients/client-form.svelte';
	import UserFormSheet from '$lib/components/pages/settings/users/user-form-sheet.svelte';
	import { page } from '$app/state';

	let { data, form }: PageProps = $props();

	let clientFormOpen = $state<boolean>(false);
	let userFormOpen = $state<boolean>(false);
	let errors = $derived(form?.errors);
	let issues = $derived(form?.issues);
	let users = $derived(page.data?.users || []);
	let customers = $derived<CustomerWithId[]>(data.customers as CustomerWithId[]);
	let products = $derived<Product[]>(
		data.products.map((p: any) => ({
			id: p.id,
			purchase_description: p.purchase_description || '',
			sales_description: p.sales_description || '',
			sale_price: parseFloat(p.sale_price || '0'),
			item_code: p.sku,
			barcode: p.barcode || undefined,
			category_id: p.category?.id || 0,
			quantity: p.quantity || 0,
			minimum_quantity: p.minimum_quantity || 0
		}))
	);
	let selectedCustomerId = $state<string>('');
	let selectedCustomer = $derived(
		customers.find((customer) => customer.id === parseInt(selectedCustomerId))
	);
	let selectedStaffUserId = $state<string>('');
	let selectedStaffUser = $derived(users.find((user) => user.id === parseInt(selectedStaffUserId)));

	let selectedOrderType = $state<string>('');
	let selectedOrderTypeLabel = $derived.by(() => {
		switch (selectedOrderType) {
			case 'onetime':
				return 'One-time';
			case 'installment':
				return 'Installment';
			default:
				return null;
		}
	});
	let dateOrdered = $state<Date | null>(null);
	let notes = $state<string>('');

	let items = $state([
		{
			id: 0,
			product_id: '',
			quantity: 1,
			unit_price: 0,
			total_price: 0,
			serial_number: ''
		}
	]);

	let submitAction = $state<'close' | 'new'>('close');

	const submitForm: SubmitFunction = async () => {
		return async ({ result }) => {
			if (result.type === 'success') {
				toast.success('Sales order created successfully');
				if (submitAction === 'new') {
					// reset page states
					selectedCustomerId = '';
					selectedOrderType = '';
					dateOrdered = null;
					notes = '';
					items = [
						{
							id: 0,
							product_id: '',
							quantity: 1,
							unit_price: 0,
							total_price: 0,
							serial_number: ''
						}
					];

					goto(resolve('/customers/sales-orders/form'));
				} else {
					goto(resolve('/customers/sales-orders'));
				}
			} else {
				await applyAction(result);
				toast.error('Failed to create sales order');
			}
		};
	};

	const showClientForm = () => {
		clientFormOpen = true;
	};

	const onClientFormSucceed = (clientId: number) => {
		selectedCustomerId = clientId.toString();
	};
</script>

<svelte:head>
	<title>RamTech | Sales Orders Form</title>
	<meta name="description" content="Sales orders form" />
</svelte:head>

<ClientForm bind:open={clientFormOpen} hasTrigger={false} onSuccess={onClientFormSucceed} />
<UserFormSheet bind:open={userFormOpen} />
<div class="mb-6 flex flex-col gap-6">
	<form
		class="flex flex-col gap-6"
		method="post"
		action="?/createSalesOrder"
		use:enhance={submitForm}
	>
		<Card class="rounded-lg">
			<CardHeader>
				<CardTitle>Sales man</CardTitle>
				<CardDescription>Select sales person</CardDescription>
			</CardHeader>
			<CardContent>
				<div>
					<Select type="single" name="staff_user_id" bind:value={selectedStaffUserId}>
						<SelectTrigger
							class={[
								'h-10 !w-[calc(50%_-_12px)]',
								errors?.properties?.customer_id ? 'border-red-500' : ''
							]}
						>
							{selectedStaffUser ? selectedStaffUser.name : 'Select Sales Person'}
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<!-- <SelectItem value="0" onclick={showClientForm}>Add Client</SelectItem> -->
								{#each users as user (user.id)}
									<SelectItem value={user.id.toString()}>{user.name}</SelectItem>
								{/each}
							</SelectGroup>
						</SelectContent>
					</Select>
					{#if errors?.properties?.staff_user_id}
						<small class="text-red-500">
							{errors.properties.staff_user_id.errors[0]}
						</small>
					{/if}
				</div>
			</CardContent>
		</Card>
		<Card class="rounded-lg">
			<CardHeader>
				<CardTitle>Create Sales Order</CardTitle>
				<CardDescription>Create a new sales order for a customer.</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="flex flex-col gap-6">
					<div class="flex flex-wrap gap-6">
						<div class="flex flex-1 flex-col gap-2">
							<Label>Customer</Label>
							<div>
								<Select type="single" name="customer_id" bind:value={selectedCustomerId}>
									<SelectTrigger
										class={['h-10 w-full', errors?.properties?.customer_id ? 'border-red-500' : '']}
									>
										{selectedCustomer ? selectedCustomer.name : 'Select Customer'}
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectItem value="0" onclick={showClientForm}>Add Client</SelectItem>
											{#each customers as customer (customer.id)}
												<SelectItem value={customer.id.toString()}>{customer.name}</SelectItem>
											{/each}
										</SelectGroup>
									</SelectContent>
								</Select>
								{#if errors?.properties?.customer_id}
									<small class="text-red-500">
										{errors.properties.customer_id.errors[0]}
									</small>
								{/if}
							</div>
						</div>
						<div class="flex flex-1 flex-col gap-2">
							<Label>Order Type</Label>
							<div>
								<Select type="single" name="order_type" bind:value={selectedOrderType}>
									<SelectTrigger
										class={['h-10 w-full', errors?.properties?.order_type ? 'border-red-500' : '']}
									>
										{selectedOrderTypeLabel ? selectedOrderTypeLabel : 'Select Type'}
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectItem value="onetime">One-time</SelectItem>
											<SelectItem value="installment">Installment</SelectItem>
										</SelectGroup>
									</SelectContent>
								</Select>
								{#if errors?.properties?.order_type}
									<small class="text-red-500">
										{errors.properties.order_type.errors[0]}
									</small>
								{/if}
							</div>
						</div>
					</div>
					<div class="flex flex-wrap gap-6">
						<div class="flex flex-1 flex-col gap-2">
							<Label>Date Ordered</Label>
							<div class="flex flex-col gap-1">
								<DatePicker
									bind:value={dateOrdered}
									error={errors?.properties?.date_ordered ? true : false}
									name="date_ordered"
								/>
								{#if errors?.properties?.date_ordered}
									<small class="text-red-500">
										{errors.properties.date_ordered.errors[0]}
									</small>
								{/if}
							</div>
						</div>
						<div class="flex flex-1 flex-col gap-2">
							<Label>Notes</Label>
							<Textarea
								bind:value={notes}
								name="notes"
								class="h-10"
								placeholder="Add any additional notes about this order..."
							/>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>

		<SelectProduct bind:items {products} issues={findErrorByKey(issues, 'products')} />
		<div class="flex gap-3 self-end">
			<Button variant="outline" href="/customers/sales-orders">Cancel</Button>
			<Button variant="outline" type="submit" onclick={() => (submitAction = 'new')}
				>Save and New</Button
			>
			<Button type="submit" onclick={() => (submitAction = 'close')}>Save and Close</Button>
		</div>
	</form>
</div>
