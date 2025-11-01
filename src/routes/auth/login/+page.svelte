<script lang="ts">
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { CircleAlert, CircleCheck } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { form }: PageProps = $props();

	const formEnhance: SubmitFunction = async () => {
		return async ({ result }) => {
			await applyAction(result);
			if (result.type === 'success') {
				setTimeout(() => {
					goto(resolve('/'));
				}, 1000);
			}
		};
	};
</script>

<svelte:head>
	<title>RamTech | Login</title>
	<meta name="description" content="RamTech Login" />
</svelte:head>

<div class="flex h-full items-center justify-center">
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle>Sign in</CardTitle>
			<CardDescription>Access your Ramtech system</CardDescription>
		</CardHeader>
		<CardContent class="space-y-6">
			{#if form && !form?.success}
				<Alert variant="destructive">
					<CircleAlert />
					<AlertTitle>Login failed.</AlertTitle>
					{#if form?.error}
						<AlertDescription>
							{form.error}
						</AlertDescription>
					{/if}
				</Alert>
			{:else if form && form?.success}
				<Alert variant="default" class="text-green-500">
					<CircleCheck />
					<AlertTitle>Successfully login.</AlertTitle>
				</Alert>
			{/if}
			<form class="space-y-6" method="post" use:enhance={formEnhance}>
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input id="email" name="email" type="email" placeholder="Enter Email" />
				</div>
				<div class="space-y-2">
					<Label for="password">Password</Label>
					<Input id="password" name="password" type="password" placeholder="Enter Password" />
				</div>
				<Button type="submit" class="w-full">Sign in</Button>
			</form>
		</CardContent>
	</Card>
</div>
