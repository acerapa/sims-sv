<script>
	import PageTitle from '$lib/components/layout/PageTitle.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Ellipsis, PhilippinePeso, Store, Users } from '@lucide/svelte';
</script>

<svelte:head>
	<title>RamTech | Settings</title>
	<meta name="description" content="RamTech Settings Dashboard" />
</svelte:head>

<section class="flex flex-col gap-4">
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

	<Card>
		<CardHeader class="flex items-center justify-between">
			<div class="flex flex-col gap-1">
				<CardTitle class="flex items-center gap-2">
					<Store class="size-5 text-blue-500" />
					<h2>Store Management</h2>
				</CardTitle>
				<CardDescription>Manage store branches records</CardDescription>
			</div>
			<Button variant="outline" href="settings/stores" class="flex items-center gap-2">
				<Store />
				Manage Stores
			</Button>
		</CardHeader>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<PhilippinePeso class="size-5 text-blue-500" />
				Selling Price Brackets
			</CardTitle>
			<CardDescription>
				Configure markup percentages based on product cost ranges.Formula: Selling Price = Cost × (1
				+ Markup%)
			</CardDescription>
		</CardHeader>
		<CardContent>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Bracket #</TableHead>
						<TableHead>Lower Limit</TableHead>
						<TableHead>Upper Limit</TableHead>
						<TableHead>Markup %</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell>BRACKET-1</TableCell>
						<TableCell>0</TableCell>
						<TableCell>1000</TableCell>
						<TableCell>10%</TableCell>
						<TableCell>
							<Ellipsis />
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>BRACKET-2</TableCell>
						<TableCell>1001</TableCell>
						<TableCell>2000</TableCell>
						<TableCell>15%</TableCell>
						<TableCell>
							<Ellipsis />
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>BRACKET-3</TableCell>
						<TableCell>2001</TableCell>
						<TableCell>3000</TableCell>
						<TableCell>20%</TableCell>
						<TableCell>
							<Ellipsis />
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</CardContent>
	</Card>
</section>
