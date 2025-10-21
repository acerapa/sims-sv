<script lang="ts">
	let { children } = $props();
	import Header from '$lib/components/layout/Header.svelte';
	import '../app.css';
	import { page } from '$app/state';

	const route = $derived(page.route.id as string);
</script>

<div class="flex min-h-screen flex-col">
	{#if route && !route.startsWith('/auth')}
		<Header />
	{/if}
	<div class="h-[calc(100vh_-_64px)] bg-slate-50">
		<main class="mx-auto h-full w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			{@render children()}
		</main>
	</div>
</div>
