<script lang="ts">
	import { enhance, applyAction } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardDescription, CardTitle } from '$lib/components/ui/card';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
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
	import { Switch } from '$lib/components/ui/switch';
	import { getRoleLabel } from '$lib/utils/common';
	import { Plus } from '@lucide/svelte';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { form } = $props();

	let sheetState = $state(false);
	let selectedRole = $state('');
	let isActive = $state(true);

	const errors = $derived(form?.errors);

	const formEnhance: SubmitFunction = async () => {
		return async ({ result }) => {
			if (result.type === 'success') {
				await invalidate('settings:users');
				sheetState = false;
			}

			await applyAction(result);
		};
	};

	$effect(() => {
		if (!sheetState) {
			form = null;
			console.log('Here');
		}
	});
</script>

<Sheet bind:open={sheetState}>
	<SheetTrigger
		class="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
	>
		<Plus class="size-4" />
		Add User
	</SheetTrigger>
	<SheetContent side="right" class="sm:!max-w-2xl">
		<SheetHeader>
			<SheetTitle>Add New User</SheetTitle>
			<SheetDescription>Fill in the details to add a new user</SheetDescription>
		</SheetHeader>
		<form method="post" id="user-form" use:enhance={formEnhance}>
			<div class="space-y-4 px-4">
				<div class="space-y-2">
					<Label for="name">Full Name</Label>
					<div>
						<Input
							class={errors?.properties?.name ? 'border-red-500' : ''}
							id="name"
							name="name"
							type="text"
							placeholder="Enter full Name"
						/>
						{#if errors?.properties?.name}
							<small class="text-red-500">{errors.properties.name.errors[0]}</small>
						{/if}
					</div>
				</div>
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<div>
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="email@example.com"
							class={errors?.properties?.email ? 'border-red-500' : ''}
						/>
						{#if errors?.properties?.email}
							<small class="text-red-500">{errors.properties.email.errors[0]}</small>
						{/if}
					</div>
				</div>
				<div class="space-y-2">
					<Label for="password">Password</Label>
					<div>
						<Input
							id="password"
							name="password"
							type="password"
							placeholder="•••••••••••"
							class={errors?.properties?.password ? 'border-red-500' : ''}
						/>
						{#if errors?.properties?.password}
							<small class="text-red-500">{errors.properties.password.errors[0]}</small>
						{/if}
					</div>
				</div>
				<div class="space-y-2">
					<Label for="role">Role</Label>
					<div>
						<Select type="single" name="role" bind:value={selectedRole}>
							<SelectTrigger class={['w-full', errors?.properties?.role ? 'border-red-500' : '']}>
								{selectedRole ? getRoleLabel(selectedRole) : 'Select role'}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="admin">Admin</SelectItem>
								<SelectItem value="inventory-manager">Inventory Manager</SelectItem>
								<SelectItem value="cashier">Cashier</SelectItem>
							</SelectContent>
						</Select>
						{#if errors?.properties?.role}
							<small class="text-red-500">{errors.properties.role.errors[0]}</small>
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
					<Button type="submit">Add user</Button>
				</div>
			</div>
		</form>
	</SheetContent>
</Sheet>
