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
	import { CircleAlert } from '@lucide/svelte';
	import type { PageProps } from '../$types';
	import type { LoginResponse } from './+page.server';

	let { form }: PageProps = $props();
	const typedForm = form as LoginResponse | null;
</script>

<div class="flex h-full items-center justify-center">
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle>Sign in</CardTitle>
			<CardDescription>Access your Ramtech system</CardDescription>
		</CardHeader>
		<CardContent class="space-y-6">
			{#if typedForm && !typedForm?.success}
				<Alert variant="destructive">
					<CircleAlert />
					<AlertTitle>Login failed.</AlertTitle>
					{#if typedForm?.error}
						<AlertDescription>
							{typedForm.error}
						</AlertDescription>
					{/if}
				</Alert>
			{/if}
			<form class="space-y-6" method="post">
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
