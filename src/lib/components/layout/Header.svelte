<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		Trigger,
		Content,
		Group,
		Item,
		Separator
	} from '$lib/components/ui/dropdown-menu';
	import { Avatar, Fallback, Image } from '$lib/components/ui/avatar';
	import Input from '../ui/input/input.svelte';
	import { Bell, ChevronDown, LogOut, Search, Settings, User } from '@lucide/svelte';
	import Badge from '../ui/badge/badge.svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { isRouteActive } from '$lib/utils/routes';
	import type { SafeUser } from '$lib/types/global';
	import { enhance } from '$app/forms';
	const path = $derived(page.route.id as string);

	let { auth_user } = $props<{ auth_user: SafeUser | null }>();

	const nameInitials = $derived.by(() => {
		if (!auth_user) return 'GU';

		const parts = auth_user.name.trim().split(/\s+/);

		if (parts.length === 1) {
			return parts[0].slice(0, 2).toUpperCase();
		}

		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	});
</script>

<header class="sticky top-0 left-0 z-50 flex w-full justify-center border-b border-border bg-white">
	<div class="flex w-full max-w-7xl gap-8 px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 flex-1 items-center justify-between gap-6">
			<div class="flex">
				<p class="text-xl !font-bold">RamTech</p>
			</div>
			<nav class="flex gap-6">
				<a href={resolve('/')}>
					<Button
						variant={isRouteActive('/', path) ? 'info' : 'ghost'}
						class="text-muted-foreground"
					>
						Dashboard
					</Button>
				</a>
				<a href={resolve('/customers')}>
					<Button
						variant={isRouteActive('/customers', path) ? 'info' : 'ghost'}
						class="text-muted-foreground">Customers</Button
					>
				</a>
				<a href={resolve('/vendors/inventory')}>
					<Button
						variant={isRouteActive('/vendors', path) || path?.startsWith('/vendors')
							? 'info'
							: 'ghost'}
						class="text-muted-foreground">Vendors</Button
					>
				</a>
				<a href={resolve('/reports')}>
					<Button
						variant={isRouteActive('/reports', path) ? 'info' : 'ghost'}
						class="text-muted-foreground"
					>
						Reports
					</Button>
				</a>
				<a href={resolve('/settings')}>
					<Button
						variant={isRouteActive('/settings', path) ? 'info' : 'ghost'}
						class="text-muted-foreground"
					>
						Settings
					</Button>
				</a>
			</nav>
		</div>
		<div class="flex flex-1 items-center gap-3">
			<div class="relative flex-1 text-gray-500">
				<Search class="absolute top-2.5 left-2.5 size-4" />
				<Input type="search" class="pl-8" placeholder="Search..." />
			</div>
			<Button variant="ghost" class="relative">
				<Bell class="size-4.5" />
				<Badge variant="destructive" class="absolute -top-1.5 -right-1.5 bg-red-500 px-1.5">
					3
				</Badge>
			</Button>
			<DropdownMenu>
				<Trigger
					class="flex cursor-pointer items-center gap-3 rounded-md px-3 py-1 text-sm font-medium hover:bg-slate-100"
				>
					<Avatar>
						<Image src="/avatar.png" alt="Avatar" />
						<Fallback>{nameInitials}</Fallback>
					</Avatar>
					<p>{auth_user?.name}</p>
					<ChevronDown class="size-4" />
				</Trigger>
				<Content>
					<Group>
						<Item class="flex items-center gap-1">
							<User />
							<p>Profile</p>
						</Item>
						<Item class="flex items-center gap-1">
							<Settings />
							<p>Settings</p>
						</Item>
					</Group>
					<Separator />
					<Group>
						<form action="/api/logout" method="post" use:enhance>
							<button type="submit" class="w-full">
								<Item class="flex items-center gap-1">
									<LogOut />
									<p>Log Out</p>
								</Item>
							</button>
						</form>
					</Group>
				</Content>
			</DropdownMenu>
		</div>
	</div>
</header>
