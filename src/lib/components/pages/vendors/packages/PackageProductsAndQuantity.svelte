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
		sale_price: string;
	}

	interface Row {
		product_id: string;
		quantity: number | null;
		serial_number: string | null;
		price: string | null;
		total_price: string | null;
	}

	interface Props {
		disabled?: boolean;
		issues: z.core.$ZodIssue[] | undefined;
		products: ProductOption[];
		rows: Row[];
	}

	let { disabled = false, issues, products, rows = $bindable() }: Props = $props();

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
		rows.push({ product_id: '', quantity: 1, serial_number: null, price: '0', total_price: '0' });
	};

	const removeRow = (ndx: number) => {
		rows.splice(ndx, 1);
		groupedIssues.splice(ndx, 1);
	};

	const onSelectProduct = (product: (typeof products)[0]) => {
		const row = rows.find((r) => Number(r.product_id) == product.id);
		if (row) {
			row.price = product.sale_price;
			row.total_price = row.quantity ? (row.quantity * Number(row.price)).toString() : null;
		}
	};

	const onChangeQuantity = (productId: string) => {
		if (productId) {
			const row = rows.find((r) => r.product_id == productId);
			if (row) {
				row.total_price = row.quantity ? (row.quantity * Number(row.price)).toString() : null;
			}
		}
	};
</script>

<div class="space-x-2 border">
	<Table>
		<TableHeader>
			<TableRow>
				<TableHead>Product</TableHead>
				<TableHead>SN Number</TableHead>
				<TableHead>Quantity</TableHead>
				<TableHead>Price</TableHead>
				<TableHead>Total Price</TableHead>
				<TableHead></TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each rows as _, ndx (ndx)}
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
								onSelect={onSelectProduct}
							/>
							{#if groupedIssues[ndx]?.product_id}
								<small class="text-red-500">{groupedIssues[ndx]?.product_id}</small>
							{/if}
						</div>
					</TableCell>
					<TableCell class="w-40">
						<div>
							<Input
								type="text"
								class="field-sizing-content"
								name={`products.${ndx}.serial_number`}
								bind:value={rows[ndx].serial_number}
								placeholder="Enter serial number"
								{disabled}
							/>
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
								onchange={() => onChangeQuantity(rows[ndx].product_id)}
								{disabled}
							/>
							{#if groupedIssues[ndx]?.quantity}
								<small class="text-red-500">{groupedIssues[ndx]?.quantity}</small>
							{/if}
						</div>
					</TableCell>
					<TableCell class="align-top w-24">
						<div>
							<Input
								type="number"
								min="0"
								class={['disabled:opacity-100 field-sizing-content', groupedIssues[ndx]?.price ? 'border-red-500' : '']}
								name={`products.${ndx}.price`}
								bind:value={rows[ndx].price}
								placeholder="Enter price"
								{disabled}
							/>
							{#if groupedIssues[ndx]?.price}
								<small class="text-red-500">{groupedIssues[ndx]?.price}</small>
							{/if}
						</div>
					</TableCell>
					<TableCell class="align-top">
						<div>
							<Input
								type="number"
								min="0"
								class={[
									'disabled:opacity-100 field-sizing-content',
									groupedIssues[ndx]?.total_price ? 'border-red-500' : ''
								]}
								name={`products.${ndx}.total_price`}
								bind:value={rows[ndx].total_price}
								placeholder="Enter total price"
								{disabled}
							/>
							{#if groupedIssues[ndx]?.total_price}
								<small class="text-red-500">{groupedIssues[ndx]?.total_price}</small>
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
