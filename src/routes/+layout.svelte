<script lang="ts">
	import type { LayoutParams } from './$types';
	import Header from '$lib/components/layout/Header.svelte';
	import '../app.css';
	import { page } from '$app/state';
	import { Toaster } from 'svelte-sonner';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './+layout.server';

	const route = $derived(page.route.id as string);
	type CustomLayoutProps = {
		data: LayoutData;
		children: Snippet;
		params: LayoutParams;
	};
	let { data, children }: CustomLayoutProps = $props() as CustomLayoutProps;
</script>

<Toaster />
<div class="flex min-h-screen flex-col">
	{#if route && !route.startsWith('/auth')}
		<Header auth_user={data.auth_user} />
	{/if}
	<div class="h-[calc(100vh_-_64px)] bg-slate-50">
		<main class="mx-auto h-full w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			{@render children()}
		</main>
	</div>
</div>
