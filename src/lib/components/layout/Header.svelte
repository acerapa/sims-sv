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
</script>

<header class="fixed top-0 left-0 w-full border-b border-border bg-white">
	<div class="mx-auto flex max-w-7xl gap-8 px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 flex-1 items-center justify-between gap-6">
			<div class="flex">
				<p class="text-xl !font-bold">RamTech</p>
			</div>
			<nav class="flex gap-6">
				<a href={resolve('/')}>
					<Button variant="ghost">Dashboard</Button>
				</a>
				<a href={resolve('/sales')}>
					<Button variant="ghost">Sales</Button>
				</a>
				<a href={resolve('/inventory')}>
					<Button variant="ghost">Inventory</Button>
				</a>
				<a href={resolve('/reports')}>
					<Button variant="ghost">Reports</Button>
				</a>
				<a href="#">
					<Button variant="ghost">Settings</Button>
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
				<Badge variant="destructive" class="absolute -top-1.5 -right-1.5 px-1.5 ">3</Badge>
			</Button>
			<DropdownMenu>
				<Trigger>
					<Button class="flex items-center gap-3" variant="ghost">
						<Avatar>
							<Image src="/avatar.png" alt="Avatar" />
							<Fallback>JD</Fallback>
						</Avatar>
						<p>John Doe</p>
						<ChevronDown class="size-4" />
					</Button>
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
						<Item class="flex items-center gap-1">
							<LogOut />
							<p>Log Out</p>
						</Item>
					</Group>
				</Content>
			</DropdownMenu>
		</div>
	</div>
</header>
