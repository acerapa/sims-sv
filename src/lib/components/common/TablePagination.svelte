<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';
	import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from '@lucide/svelte';

	interface Props {
		page: number;
		totalPages: number;
		total: number;
		limit: number;
		onPageChange: (page: number) => void;
		onLimitChange: (limit: number) => void;
	}

	let { page, totalPages, total, limit, onPageChange, onLimitChange }: Props = $props();

	const limitOptions = [10, 25, 50, 100];

	let startItem = $derived((page - 1) * limit + 1);
	let endItem = $derived(Math.min(page * limit, total));
</script>

<div class="flex items-center justify-between px-2 py-4">
	<div class="text-sm text-muted-foreground">
		{#if total > 0}
			Showing {startItem} to {endItem} of {total} products
		{:else}
			No products found
		{/if}
	</div>

	<div class="flex items-center gap-4">
		<div class="flex items-center gap-2">
			<span class="text-sm text-muted-foreground">Rows per page</span>
			<Select
				type="single"
				value={limit.toString()}
				onValueChange={(v) => v && onLimitChange(parseInt(v))}
			>
				<SelectTrigger class="w-16">{limit}</SelectTrigger>
				<SelectContent>
					{#each limitOptions as opt}
						<SelectItem value={opt.toString()}>{opt}</SelectItem>
					{/each}
				</SelectContent>
			</Select>
		</div>

		<div class="flex items-center gap-1">
			<Button variant="outline" size="icon" disabled={page <= 1} onclick={() => onPageChange(1)}>
				<ChevronsLeft class="size-4" />
			</Button>
			<Button
				variant="outline"
				size="icon"
				disabled={page <= 1}
				onclick={() => onPageChange(page - 1)}
			>
				<ChevronLeft class="size-4" />
			</Button>
			<span class="px-2 text-sm">
				Page {page} of {totalPages || 1}
			</span>
			<Button
				variant="outline"
				size="icon"
				disabled={page >= totalPages}
				onclick={() => onPageChange(page + 1)}
			>
				<ChevronRight class="size-4" />
			</Button>
			<Button
				variant="outline"
				size="icon"
				disabled={page >= totalPages}
				onclick={() => onPageChange(totalPages)}
			>
				<ChevronsRight class="size-4" />
			</Button>
		</div>
	</div>
</div>
