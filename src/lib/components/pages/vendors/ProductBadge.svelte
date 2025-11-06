<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { onMount } from 'svelte';

	interface Props {
		quantity: number;
		minimum_quantity: number | null;
	}

	let { quantity, minimum_quantity = 0 }: Props = $props();

	let badgeText = $state<string>('');
	let badgeBg = $state<string>('');

	onMount(() => {
		if (quantity > minimum_quantity!) {
			badgeText = 'In Stock';
			badgeBg = 'bg-green-500';
		} else if (quantity <= minimum_quantity! && quantity != 0) {
			badgeText = 'Low Stock';
			badgeBg = 'bg-yellow-500';
		} else {
			badgeText = 'Out of Stock';
			badgeBg = 'bg-red-500';
		}
	});
</script>

<Badge variant="default" class={['rounded-full px-3 py-1', badgeBg]}>{badgeText}</Badge>
