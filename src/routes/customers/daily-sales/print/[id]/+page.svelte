<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { formatCurrency } from '$lib/utils/common';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let order = $derived(data.salesOrder);
	let subtotal = $derived(
		order.items.reduce((sum, item) => sum + Number(item.total_price || 0), 0)
	);

	onMount(() => {
		const timeout = window.setTimeout(() => window.print(), 300);
		return () => window.clearTimeout(timeout);
	});

	function printReceipt() {
		window.print();
	}
</script>

<svelte:head>
	<title>Print Sale SO-{order.id}</title>
</svelte:head>

<div class="receipt-page">
	<div class="no-print mb-4 flex justify-between">
		<Button variant="outline" onclick={() => goto('/customers/daily-sales')}
			>Back to Daily Sales</Button
		>
		<Button onclick={printReceipt}>Print</Button>
	</div>

	<header class="receipt-header">
		<div class="company">
			<h1>RAM TECH VENTURES INC.</h1>
			<p>BARTOLOME BLDG. MAGSAYSAY BLVD.</p>
			<p>BRGY. EAST AWANG POB.</p>
			<p>CALBAYOG CITY, SAMAR</p>
		</div>
		<div class="title-area">
			<h2>SALES-DELIVERY RECEIPT</h2>
			<table class="reference-table">
				<tbody>
					<tr><th>Date</th><th>Sale No.</th></tr>
					<tr>
						<td>{new Date(order.date_ordered).toLocaleDateString()}</td>
						<td>{order.id}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</header>

	<section class="sold-to">
		<div class="box-title">Sold To</div>
		<div class="customer-details">
			<strong>{order.customer?.name || '—'}</strong>
			{#if order.customer?.address}<span>{order.customer.address}</span>{/if}
		</div>
	</section>

	<table class="payment-table">
		<tbody>
			<tr>
				<th>Check No.</th>
				<th>Payment Method</th>
				<th>Rep</th>
				<th>Project</th>
			</tr>
			<tr>
				<td>{data.payment?.check_number || ''}</td>
				<td class="capitalize">{data.payment?.payment_type?.replaceAll('_', ' ') || '—'}</td>
				<td>{order.staff?.name || ''}</td>
				<td></td>
			</tr>
		</tbody>
	</table>

	<table class="items-table">
		<thead>
			<tr>
				<th class="item-column">Item</th>
				<th class="quantity-column">Qty</th>
				<th class="rate-column">Rate</th>
				<th class="serial-column">S/N</th>
				<th class="amount-column">Amount</th>
			</tr>
		</thead>
		<tbody>
			{#each order.items as item (item.id)}
				<tr>
					<td>{item.package?.name || item.product?.sales_description || '—'}</td>
					<td class="number">{item.quantity}</td>
					<td class="number">{formatCurrency(item.unit_price)}</td>
					<td>{item.serial_number || ''}</td>
					<td class="number">{formatCurrency(item.total_price)}</td>
				</tr>
			{/each}
			{#each { length: Math.max(0, 8 - order.items.length) }}
				<tr class="blank-row"><td></td><td></td><td></td><td></td><td></td></tr>
			{/each}
		</tbody>
	</table>

	<div class="totals">
		<div><strong>Subtotal</strong><span>{formatCurrency(subtotal)}</span></div>
		{#if Number(order.discount) > 0}
			<div><strong>Discount</strong><span>-{formatCurrency(order.discount)}</span></div>
		{/if}
		<div class="grand-total">
			<strong>Total</strong><span>{formatCurrency(order.total_cost)}</span>
		</div>
	</div>

	<div class="signature">SIGNATURE OVER PRINTED NAME</div>
</div>

<style>
	.receipt-page {
		box-sizing: border-box;
		width: 100%;
		max-width: 210mm;
		min-height: 250mm;
		margin: 0 auto;
		padding: 8mm;
		background: #fff;
		color: #000;
		font-family: Arial, Helvetica, sans-serif;
		font-size: 11px;
	}

	.receipt-header {
		display: grid;
		grid-template-columns: 1fr 1fr;
		align-items: start;
		gap: 8mm;
		margin-bottom: 5mm;
	}

	.company h1 {
		display: inline-block;
		margin: 0 0 2mm;
		border: 1px solid #000;
		padding: 1.5mm;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 16px;
		font-weight: 700;
	}

	.company p {
		margin: 0;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 10px;
		line-height: 1.3;
	}

	.title-area {
		text-align: center;
	}

	.title-area h2 {
		margin: 0 0 3mm;
		font-size: 18px;
		font-weight: 700;
		white-space: nowrap;
	}

	table {
		border-collapse: collapse;
	}

	th,
	td {
		border: 1px solid #000;
		padding: 2mm;
	}

	.reference-table {
		width: 60%;
		margin-left: auto;
		font-size: 10px;
	}

	.reference-table th,
	.reference-table td {
		text-align: center;
	}

	.sold-to {
		width: 48%;
		height: 35mm;
		border: 1px solid #000;
		margin-bottom: 10mm;
	}

	.box-title {
		height: 8mm;
		padding: 1.5mm;
		border-bottom: 1px solid #000;
	}

	.customer-details {
		display: flex;
		flex-direction: column;
		gap: 1mm;
		padding: 2mm;
		text-transform: uppercase;
	}

	.payment-table {
		width: 57%;
		margin: 0 0 0 auto;
		text-align: center;
	}

	.payment-table th,
	.items-table th {
		font-weight: 400;
	}

	.payment-table td {
		height: 10mm;
	}

	.items-table {
		width: 100%;
		table-layout: fixed;
	}

	.items-table th {
		text-align: center;
	}

	.item-column {
		width: 55%;
	}
	.quantity-column {
		width: 7%;
	}
	.rate-column {
		width: 10%;
	}
	.serial-column {
		width: 16%;
	}
	.amount-column {
		width: 12%;
	}

	.items-table tbody td {
		height: 8mm;
		vertical-align: top;
	}

	.items-table .number {
		text-align: right;
		white-space: nowrap;
	}

	.blank-row td {
		height: 13mm !important;
	}

	.totals {
		width: 40%;
		margin-left: auto;
		border: 1px solid #000;
		border-top: 0;
	}

	.totals > div {
		display: flex;
		justify-content: space-between;
		padding: 3mm;
	}

	.grand-total {
		border-top: 1px solid #000;
		font-size: 15px;
	}

	.signature {
		width: 48%;
		margin-top: 10mm;
		border: 1px solid #000;
		padding: 1.5mm;
		font-size: 12px;
	}

	@media print {
		@page {
			size: letter portrait;
			margin: 8mm;
		}

		:global(body) {
			background: #fff;
		}

		:global(main) {
			max-width: none !important;
			height: auto !important;
			padding: 0 !important;
		}

		:global(.overflow-y-auto) {
			height: auto !important;
			overflow: visible !important;
		}

		:global(main > section) {
			display: block !important;
		}

		.no-print {
			display: none !important;
		}

		.receipt-page {
			max-width: none;
			min-height: 0;
			padding: 0;
		}
	}
</style>
