<script lang="ts">
	import { TableHead } from '$lib/components/ui/table';
	import { ArrowUp, ArrowDown, ArrowUpDown } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	interface Props {
		column: string;
		label: string;
		currentSort: string;
		currentOrder: 'asc' | 'desc';
		onSort: (column: string) => void;
		class?: string;
	}

	let { column, label, currentSort, currentOrder, onSort, class: className }: Props = $props();

	let isActive = $derived(currentSort === column);
</script>

<TableHead
	class={cn('cursor-pointer select-none hover:bg-muted/50', className)}
	onclick={() => onSort(column)}
>
	<div class="flex items-center gap-2">
		<span>{label}</span>
		{#if isActive}
			{#if currentOrder === 'asc'}
				<ArrowUp class="size-4" />
			{:else}
				<ArrowDown class="size-4" />
			{/if}
		{:else}
			<ArrowUpDown class="size-4 text-muted-foreground" />
		{/if}
	</div>
</TableHead>
