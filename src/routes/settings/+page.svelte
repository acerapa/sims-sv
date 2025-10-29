<script>
	import PageTitle from '$lib/components/layout/PageTitle.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Users } from '@lucide/svelte';
</script>

<svelte:head>
	<title>RamTech | Settings</title>
	<meta name="description" content="RamTech Settings Dashboard" />
</svelte:head>

<section class="flex flex-col gap-8">
	<PageTitle title="Settings" subTitle="Configure your account and system preferences." />

	<Card>
		<CardHeader class="flex items-center justify-between">
			<div class="flex flex-col gap-1">
				<CardTitle class="flex items-center gap-2">
					<Users class="size-5 text-blue-500" />
					<h2>User Management</h2>
				</CardTitle>
				<CardDescription>Manage system users and access permissions</CardDescription>
			</div>
			<Button variant="outline" href="settings/users" class="flex items-center gap-2">
				<Users />
				Manage Users
			</Button>
		</CardHeader>
	</Card>
</section>
