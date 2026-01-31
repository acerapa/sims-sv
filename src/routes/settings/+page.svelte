<script lang="ts">
	import { page } from '$app/state';
	import PageTitle from '$lib/components/layout/PageTitle.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Trash, PhilippinePeso, Plus, Store, Users, Check } from '@lucide/svelte';

	const sellingBrackets = $derived(page.data.sellingBrackets);
	let newSellingBracket = $state<
		{ start_price: number; end_price: number; discount_percentage: number }[]
	>([]);

	const addSellingBracket = () => {
		newSellingBracket.push({
			start_price: 0,
			end_price: 0,
			discount_percentage: 0
		});
	};

	const removeSellingBracket = (index: number) => {
		newSellingBracket.splice(index, 1);
	};
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
			<div class="space-y-2">
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
						{#if sellingBrackets.length > 0}
							{#each sellingBrackets as bracket, ndx (bracket.id)}
								<TableRow>
									<TableCell>BRACKET-{bracket.id}</TableCell>
									<TableCell><Input type="number" value={bracket.lowerLimit} /></TableCell>
									<TableCell><Input type="number" value={bracket.upperLimit} /></TableCell>
									<TableCell class="flex items-center gap-2">
										<Input type="number" value={bracket.markupPercentage} />%
									</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="icon"
											class="group cursor-pointer"
											onclick={() => removeSellingBracket(ndx)}
										>
											<Trash class="h-4 w-4 text-muted-foreground group-hover:text-destructive" />
										</Button>
									</TableCell>
								</TableRow>
							{/each}
						{:else if newSellingBracket.length > 0}
							{#each newSellingBracket as bracket, ndx (bracket)}
								<TableRow>
									<TableCell>BRACKET-{bracket.id}</TableCell>
									<TableCell>
										<Input type="number" name="start_price" value={bracket.start_price} />
									</TableCell>
									<TableCell>
										<Input type="number" name="end_price" value={bracket.end_price} />
									</TableCell>
									<TableCell class="flex items-center gap-2">
										<Input
											type="number"
											name="discount_percentage"
											value={bracket.discount_percentage}
										/>%
									</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="icon"
											class="group cursor-pointer"
											onclick={() => removeSellingBracket(ndx)}
										>
											<Trash class="h-4 w-4 text-muted-foreground group-hover:text-destructive" />
										</Button>
									</TableCell>
								</TableRow>
							{/each}
						{:else}
							<TableRow>
								<TableCell colspan={5} class="text-center">No selling brackets found.</TableCell>
							</TableRow>
						{/if}
					</TableBody>
				</Table>
				<hr />
				<div class="flex items-center justify-between">
					<Button onclick={addSellingBracket} variant="outline" class="flex items-center gap-2">
						<Plus />
						Add Bracket
					</Button>
					<Button>
						<Check />
						Save Changes
					</Button>
				</div>
			</div>
		</CardContent>
	</Card>
</section>
