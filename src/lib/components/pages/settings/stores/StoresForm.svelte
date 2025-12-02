<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Card, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import {
		Sheet,
		SheetClose,
		SheetContent,
		SheetDescription,
		SheetHeader,
		SheetTitle,
		SheetTrigger
	} from '$lib/components/ui/sheet';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import { Plus } from '@lucide/svelte';

	const { form } = $props();
	const errors = $derived(form?.errors);
	let isActive = $state(false);
</script>

<Sheet>
	<SheetTrigger class={buttonVariants({ variant: 'default' })}>
		<Plus />
		Add Store
	</SheetTrigger>
	<SheetContent side="right" class="sm:!max-w-2xl">
		<SheetHeader>
			<SheetTitle>Add Store</SheetTitle>
			<SheetDescription>Fill out the form below to add a new store.</SheetDescription>
		</SheetHeader>
		<form method="post" action="/settings/stores?/createStore" id="store-form" use:enhance>
			<div class="space-y-4 px-4">
				<div class="space-y-2">
					<Label for="name">Store Name</Label>
					<div>
						<Input
							class={errors?.properties?.name ? 'border-red-500' : ''}
							id="name"
							name="name"
							type="text"
							placeholder="Enter store Name"
						/>
						{#if errors?.properties?.name}
							<small class="text-red-500">{errors.properties.name.errors[0]}</small>
						{/if}
					</div>
				</div>
				<div class="space-y-2">
					<Label for="name">Address</Label>
					<div>
						<Input
							class={errors?.properties?.address ? 'border-red-500' : ''}
							id="address"
							name="address"
							type="text"
							placeholder="Enter store address"
						/>
						{#if errors?.properties?.address}
							<small class="text-red-500">{errors.properties.address.errors[0]}</small>
						{/if}
					</div>
				</div>
				<div class="space-y-2">
					<Label for="name">Phone</Label>
					<div>
						<Input
							class={errors?.properties?.phone_number ? 'border-red-500' : ''}
							id="phone_number"
							name="phone_number"
							type="text"
							placeholder="Enter store address"
						/>
						{#if errors?.properties?.phone_number}
							<small class="text-red-500">{errors.properties.phone_number.errors[0]}</small>
						{/if}
					</div>
				</div>
				<div class="space-y-2">
					<Label for="manager">Manager</Label>
					<div>
						<Select type="single" name="manager">
							<SelectTrigger
								class={['w-full', errors?.properties?.manager ? 'border-red-500' : '']}
							>
								Select Manager
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="1">John Doe</SelectItem>
								<SelectItem value="2">John Doe</SelectItem>
							</SelectContent>
						</Select>
						{#if errors?.properties?.phone_number}
							<small class="text-red-500">{errors.properties.phone_number.errors[0]}</small>
						{/if}
					</div>
				</div>
				<Card>
					<CardHeader class="flex items-center justify-between">
						<div class="flex flex-col gap-1">
							<CardTitle>Active Status</CardTitle>
							<CardDescription>User will be able to access the system</CardDescription>
						</div>
						<Switch bind:checked={isActive} />
						<input type="hidden" name="is_active" value={isActive} />
					</CardHeader>
				</Card>
				<div class="flex items-center justify-end gap-3">
					<SheetClose type="button">
						<Button type="button" variant="outline">Cancel</Button>
					</SheetClose>
					<Button type="submit">Add store</Button>
				</div>
			</div>
		</form>
	</SheetContent>
</Sheet>
