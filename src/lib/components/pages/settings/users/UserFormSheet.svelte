<script>
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardDescription, CardTitle } from '$lib/components/ui/card';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import {
		Sheet,
		SheetContent,
		SheetDescription,
		SheetHeader,
		SheetTitle,
		SheetTrigger
	} from '$lib/components/ui/sheet';
	import { Switch } from '$lib/components/ui/switch';
	import { Plus } from '@lucide/svelte';

	let selectedRole = $state('');
</script>

<Sheet>
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
		<form method="post" use:enhance>
			<div class="space-y-4 px-4">
				<div class="space-y-2">
					<Label for="name">Full Name</Label>
					<Input id="name" name="name" type="text" placeholder="Enter full Name" />
				</div>
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input id="email" name="email" type="email" placeholder="email@example.com" />
				</div>
				<div class="space-y-2">
					<Label for="password">Password</Label>
					<Input id="password" name="password" type="password" placeholder="•••••••••••" />
				</div>
				<div class="space-y-2">
					<Label for="role">Role</Label>
					<Select type="single" name="role" bind:value={selectedRole}>
						<SelectTrigger class="w-full">
							{selectedRole ? selectedRole : 'Select role'}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="admin">Admin</SelectItem>
							<SelectItem value="inventory-manager">Inventory Manager</SelectItem>
							<SelectItem value="user">User</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<Card>
					<CardHeader class="flex items-center justify-between">
						<div class="flex flex-col gap-1">
							<CardTitle>Active Status</CardTitle>
							<CardDescription>User will be able to access the system</CardDescription>
						</div>
						<Switch name="is_active" />
					</CardHeader>
				</Card>
				<div class="flex items-center justify-end gap-3">
					<Button type="button" variant="outline">Cancel</Button>
					<Button type="submit">Add user</Button>
				</div>
			</div>
		</form>
	</SheetContent>
</Sheet>
