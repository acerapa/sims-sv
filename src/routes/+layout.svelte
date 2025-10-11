<script lang="ts">
	let { children } = $props();
	import Header from '$lib/components/layout/Header.svelte';
	import '../app.css';
</script>

<div class="flex min-h-screen flex-col">
	<Header />
	{@render children()}
</div>
