<script lang="ts">
	let { children } = $props();
	import Header from '$lib/components/layout/Header.svelte';
	import '../app.css';
</script>

<div class="flex min-h-screen flex-col">
	<Header />
	<div class="mt-16 h-[calc(100vh_-_64px)] bg-slate-50">
		<main class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
			{@render children()}
		</main>
	</div>
</div>
