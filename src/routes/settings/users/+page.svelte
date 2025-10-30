<script lang="ts">
	import PageTitle from '$lib/components/layout/PageTitle.svelte';
	import UserFormSheet from '$lib/components/pages/settings/users/UserFormSheet.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import type { User } from '$lib/types/global';
	import { Ellipsis, Search } from '@lucide/svelte';

	const users: User[] = [
		{
			id: 1,
			name: 'John Doe',
			email: 'john.doe@example.com',
			role: 'Admin',
			is_active: true,
			password: 'password',
			created_at: new Date('2023-01-01'),
			updated_at: new Date('2023-01-01')
		},
		{
			id: 2,
			name: 'Jane Doe',
			email: 'jane.doe@example.com',
			role: 'Cashier',
			is_active: false,
			password: 'password',
			created_at: new Date('2023-02-01'),
			updated_at: new Date('2023-02-01')
		},
		{
			id: 3,
			name: 'Alice Smith',
			email: 'alice.smith@example.com',
			role: 'Inventory Manager',
			is_active: true,
			password: 'password',
			created_at: new Date('2023-03-01'),
			updated_at: new Date('2023-03-01')
		},
		{
			id: 4,
			name: 'Bob Johnson',
			email: 'bob.johnson@example.com',
			role: 'Cashier',
			is_active: true,
			password: 'password',
			created_at: new Date('2023-04-01'),
			updated_at: new Date('2023-04-01')
		}
	];
</script>

<svelte:head>
	<title>RamTech | Users</title>
	<meta name="description" content="RamTech User Management" />
</svelte:head>

<section class="flex flex-col gap-8">
	<PageTitle title="Users" subTitle="Manage system users and access permissions." />

	<Card>
		<CardHeader class="flex items-center justify-between">
			<div class="flex flex-col gap-1">
				<CardTitle>Users</CardTitle>
				<CardDescription>Manage system users and access permissions</CardDescription>
			</div>
			<UserFormSheet />
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="relative">
				<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input type="search" placeholder="Search Users..." class="h-10 pl-9" />
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Role</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Created</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each users as user (user.id)}
						<TableRow>
							<TableCell>
								<p class="font-medium">{user.name}</p>
							</TableCell>
							<TableCell>{user.email}</TableCell>
							<TableCell>{user.role}</TableCell>
							<TableCell>
								<Badge variant="outline">{user.is_active ? 'Active' : 'Inactive'}</Badge>
							</TableCell>
							<TableCell>{user.created_at.toLocaleDateString()}</TableCell>
							<TableCell>
								<Button variant="ghost" size="sm">
									<Ellipsis />
								</Button>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</CardContent>
	</Card>
</section>
