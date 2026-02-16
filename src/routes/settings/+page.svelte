<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
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
	import type { Bracket } from '$lib/types/global';
	import { Trash, PhilippinePeso, Plus, Store, Users, Check } from '@lucide/svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	const sellingBrackets = $derived(page.data.sellingBrackets);

	let brackets = $state<Bracket[]>([]);
	onMount(() => {
		brackets = sellingBrackets.map((bracket: Bracket) => {
			return {
				id: bracket.id,
				start_price: bracket.start_price,
				end_price: bracket.end_price,
				discount_percentage: bracket.discount_percentage,
				is_edited: false,
				is_deleted: false,
				original_values: {
					id: bracket.id,
					start_price: bracket.start_price,
					end_price: bracket.end_price,
					discount_percentage: bracket.discount_percentage
				}
			};
		});
	});

	const addSellingBracket = () => {
		brackets.push({
			start_price: 0,
			end_price: 0,
			discount_percentage: 0,
			is_deleted: false,
			is_edited: false,
			original_values: null
		});
	};

	const removeSellingBracket = (index: number) => {
		let bracket = brackets[index];
		bracket.is_deleted = true;
	};

	const enhanceForm: SubmitFunction = () => {
		return async ({ result }) => {
			await applyAction(result);
			if (result.type === 'success') {
				toast.success('Bracket updated successfully');
			} else {
				toast.error('Failed to update bracket');
			}
		};
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
			<form method="post" action="/settings?/addNewSellingBracket" use:enhance={enhanceForm}>
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
							{#each brackets as bracket, ndx (bracket)}
								<TableRow class={bracket.is_deleted ? 'hidden' : ''}>
									<TableCell>BRACKET-{bracket.id}</TableCell>
									<TableCell>
										<Input
											type="number"
											name={`brackets.${ndx}.start_price`}
											value={bracket.start_price}
										/>
										<Input
											type="hidden"
											name={`brackets.${ndx}.is_edited`}
											value={bracket.is_edited}
										/>
										<Input
											type="hidden"
											name={`brackets.${ndx}.is_deleted`}
											value={bracket.is_deleted}
										/>
										<Input type="hidden" name={`brackets.${ndx}.id`} value={bracket.id} />
									</TableCell>
									<TableCell>
										<Input
											type="number"
											name={`brackets.${ndx}.end_price`}
											value={bracket.end_price}
										/>
									</TableCell>
									<TableCell class="flex items-center gap-2">
										<Input
											type="number"
											name={`brackets.${ndx}.discount_percentage`}
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
							{#if !brackets.length || brackets.filter((b) => b.is_deleted).length == brackets.length}
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
						<Button type="submit">
							<Check />
							Save Changes
						</Button>
					</div>
				</div>
			</form>
		</CardContent>
	</Card>
</section>
