<script lang="ts">
	import {
		Select,
		SelectContent,
		SelectGroup,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';
	import type { Supplier } from '$lib/types/global';
	import z from 'zod';

	interface Props {
		disabled?: boolean;
		issues: z.core.$ZodIssue[] | undefined;
		suppliers: Supplier[];
		selected: string[];
	}

	let {
		disabled = false,
		issues,
		suppliers,
		selected = $bindable([])
	}: Props = $props();

	let triggerLabel = $derived.by(() => {
		if (!selected.length) return 'Select Suppliers';
		const names = selected
			.map((id) => suppliers.find((s) => s.id === parseInt(id))?.name)
			.filter(Boolean) as string[];
		if (names.length <= 2) return names.join(', ');
		return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
	});

	const hasError = $derived((issues ?? []).length > 0);
</script>

<div class="space-y-2">
	<Select type="multiple" {disabled} bind:value={selected}>
		<SelectTrigger
			class={['w-full disabled:opacity-100', hasError ? 'border-red-500' : '']}
		>
			<span class="truncate text-left">{triggerLabel}</span>
		</SelectTrigger>
		<SelectContent>
			<SelectGroup>
				{#if !suppliers.length}
					<SelectItem value="" disabled>No suppliers available</SelectItem>
				{/if}
				{#each suppliers as supplier (supplier.id)}
					<SelectItem value={supplier.id.toString()}>{supplier.name}</SelectItem>
				{/each}
			</SelectGroup>
		</SelectContent>
	</Select>

	{#each selected as supplierId, i (supplierId)}
		<input type="hidden" name={`suppliers.${i}.supplier_id`} value={supplierId} />
	{/each}

	{#if hasError}
		<small class="text-red-500">{issues?.[0]?.message}</small>
	{/if}
</div>
