<script lang="ts">
	import { Card, Content } from '$lib/components/ui/card';
	let { title, icon, value, diff, description, variant } = $props();

	let IconComponent = $derived(icon);

	const variantColor = () => {
		let color = '';
		switch (variant) {
			case 'success':
				color = 'text-green-500';
				break;
			case 'warning':
				color = 'text-yellow-500';
				break;
			case 'error':
				color = 'text-red-500';
				break;
			case 'info':
				color = 'text-blue-500';
				break;
			default:
				color = 'text-gray-500';
		}

		return color;
	};
</script>

<Card>
	<Content>
		<div class="flex items-center justify-between">
			<h3 class="text-sm font-medium tracking-tight text-muted-foreground">{title}</h3>
			<IconComponent class="size-5 {variantColor()}" />
		</div>
		<p class="mb-1 text-2xl font-bold text-foreground">{value}</p>
		<p class="text-xs text-muted-foreground">
			{#if diff}
				<span class={variantColor()}>{diff}</span>
			{/if}
			{description}
		</p>
	</Content>
</Card>
