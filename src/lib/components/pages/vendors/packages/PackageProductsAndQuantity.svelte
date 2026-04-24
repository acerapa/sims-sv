<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/input/input.svelte';
	import ProductCombobox from '$lib/components/common/ProductCombobox.svelte';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Trash } from '@lucide/svelte';
	import z from 'zod';

	interface ProductOption {
		id: number;
		sku: string;
		sales_description: string;
	}

	interface Row {
		product_id: string;
		quantity: number | null;
	}

	interface Props {
		disabled?: boolean;
		issues: z.core.$ZodIssue[] | undefined;
		products: ProductOption[];
		rows: Row[];
	}

	let {
		disabled = false,
		issues,
		products,
		rows = $bindable()
	}: Props = $props();

	let groupedIssues = $derived.by(() => {
		const grouped: Record<string, string>[] = [];
		for (const issue of issues || []) {
			const [_, index, field] = issue.path;
			const value = grouped[index as number];
			if (value && typeof value === 'object') {
				value[field as string] = issue.message;
			} else {
				grouped[index as number] = { [field as string]: issue.message };
			}
		}
		return grouped;
	});

	export const addRow = () => {
		rows.push({ product_id: '', quantity: 1 });
	};

	const removeRow = (ndx: number) => {
		rows.splice(ndx, 1);
		groupedIssues.splice(ndx, 1);
	};
</script>

<div class="space-x-2">
	<Table>
		<TableHeader>
			<TableRow>
				<TableHead>Product</TableHead>
				<TableHead>Quantity</TableHead>
				<TableHead></TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each rows as row, ndx (ndx)}
				<TableRow>
					<TableCell class="align-top">
						<div>
							<ProductCombobox
								{products}
								{disabled}
								bind:value={rows[ndx].product_id}
								name={`products.${ndx}.product_id`}
								getLabel={(p) => `${p.sku} — ${p.sales_description}`}
								hasError={!!groupedIssues[ndx]?.product_id}
								disabledIds={rows
									.filter((_, i) => i !== ndx)
									.map((r) => parseInt(r.product_id))
									.filter(Boolean)}
							/>
							{#if groupedIssues[ndx]?.product_id}
								<small class="text-red-500">{groupedIssues[ndx]?.product_id}</small>
							{/if}
						</div>
					</TableCell>
					<TableCell class="align-top">
						<div>
							<Input
								type="number"
								min="1"
								class={[
									'disabled:opacity-100',
									groupedIssues[ndx]?.quantity ? 'border-red-500' : ''
								]}
								name={`products.${ndx}.quantity`}
								bind:value={rows[ndx].quantity}
								placeholder="Enter quantity"
								{disabled}
							/>
							{#if groupedIssues[ndx]?.quantity}
								<small class="text-red-500">{groupedIssues[ndx]?.quantity}</small>
							{/if}
						</div>
					</TableCell>
					<TableCell class="align-top">
						<Button
							type="button"
							disabled={rows.length === 1 || disabled}
							variant="ghost"
							onclick={(e) => {
								e.preventDefault();
								removeRow(ndx);
							}}
						>
							<Trash class="text-red-500" />
						</Button>
					</TableCell>
				</TableRow>
			{/each}
		</TableBody>
	</Table>
</div>
