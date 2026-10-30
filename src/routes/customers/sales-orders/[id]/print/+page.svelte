<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { formatCurrency } from '$lib/utils/common';
	import { formatDatePdf, openAndPrint } from '$lib/utils/pdf';
	import type { PageProps } from './$types';
	import { buildDrPdf, WARRANTY_TEXT } from './pdf';

	let { data }: PageProps = $props();
	let order = $derived(data.salesOrder);
	let subtotal = $derived(
		order.items.reduce((sum, item) => sum + Number(item.total_price || 0), 0)
	);

	async function handlePrint() {
		openAndPrint(await buildDrPdf(order));
	}
</script>

<svelte:head>
	<title>Print D.R. SO-{order.id}</title>
</svelte:head>

<div class="receipt-page">
	<div class="no-print mb-4 flex justify-between">
		<Button variant="outline" onclick={() => goto(resolve('/customers/sales-orders'))}
			>Back to Sales Orders</Button
		>
		<Button onclick={handlePrint}>Print</Button>
	</div>

	<header class="dr-header">
		<div class="company">
			<div class="brand-row">
				<img src="/ramtech-logo.jpg" alt="RAM Tech Ventures logo" class="brand-logo" />
				<h1>RAM TECH VENTURES INC.</h1>
			</div>
			<p>BARTOLOME BLDG., MAGSAYSAY ST. BLVD.</p>
			<p>BRGY. EAST AWANG POB.,</p>
			<p>CALBAYOG CITY, SAMAR</p>
		</div>
		<div class="title-area">
			<h2 class="dr-title">D.R</h2>
			<table class="reference-table">
				<thead>
					<tr>
						<th>DATE</th>
						<th>S.O. NO.</th>
						<th>P.O. NO.</th>
						<th>REP</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>{formatDatePdf(order.date_ordered)}</td>
						<td>{order.id}</td>
						<td></td>
						<td>{order.staff?.name || ''}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</header>

	<section class="name-address">
		<div class="box-title">Name/Address</div>
		<div class="customer-details">
			<strong>{order.customer?.name || '—'}</strong>
			{#if order.customer?.address}<span>{order.customer.address}</span>{/if}
		</div>
	</section>

	<table class="items-table">
		<thead>
			<tr>
				<th class="item-column">Item Description</th>
				<th class="serial-column">Serial No.</th>
				<th class="quantity-column">Qty</th>
				<th class="rate-column">UP</th>
				<th class="amount-column">Total</th>
			</tr>
		</thead>
		<tbody>
			{#each order.items as item (item.id)}
				<tr>
					<td>{item.package?.name || item.product?.sales_description || '—'}</td>
					<td>{item.serial_number || ''}</td>
					<td class="number">{item.quantity}</td>
					<td class="number">{formatCurrency(item.unit_price)}</td>
					<td class="number">{formatCurrency(item.total_price)}</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<div class="totals mt-4">
		<div><strong>SUB-TOTAL</strong><span>{formatCurrency(subtotal)}</span></div>
		<div class="grand-total">
			<strong>TOTAL AMOUNT</strong><span>{formatCurrency(order.total_cost)}</span>
		</div>
	</div>

	<section class="warranty">
		<h3>FOR WARRANTY SERVICE:</h3>
		<p>{WARRANTY_TEXT}</p>
	</section>

	<div class="signatures">
		<div class="sig sig-left">
			<div class="sig-line"></div>
			<p>Signature over Printed Name</p>
			<strong>Inventory</strong>
		</div>
		<div class="sig sig-right">
			<div class="sig-line"></div>
			<p>Signature over Printed Name</p>
			<strong>Received By</strong>
		</div>
		<div class="sig sig-center">
			<div class="sig-line"></div>
			<p>Signature over Printed Name</p>
			<strong>Branch Manager</strong>
		</div>
	</div>
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

	.dr-header {
		display: grid;
		grid-template-columns: 1fr 1fr;
		align-items: start;
		gap: 8mm;
		margin-bottom: 5mm;
	}

	.brand-row {
		display: flex;
		align-items: center;
		gap: 3mm;
		margin-bottom: 2mm;
	}

	.brand-logo {
		width: 16mm;
		height: 16mm;
		object-fit: contain;
	}

	.company h1 {
		margin: 0;
		border: 1px solid #000;
		padding: 1.5mm;
		font-size: 16px;
		font-weight: 700;
	}

	.company p {
		margin: 0;
		font-size: 10px;
		line-height: 1.3;
	}

	.title-area {
		text-align: center;
	}

	.dr-title {
		margin: 0 0 3mm;
		font-size: 24px;
		font-weight: 700;
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
		width: 75%;
		margin-left: auto;
		font-size: 9px;
	}

	.reference-table th,
	.reference-table td {
		text-align: center;
	}

	.name-address {
		width: 48%;
		height: 35mm;
		border: 1px solid #000;
		margin-bottom: 6mm;
	}

	.box-title {
		height: 8mm;
		padding: 1.5mm;
		border-bottom: 1px solid #000;
		font-weight: bold;
	}

	.customer-details {
		display: flex;
		flex-direction: column;
		gap: 1mm;
		padding: 2mm;
	}

	.items-table {
		width: 100%;
		table-layout: fixed;
	}

	.items-table th {
		text-align: center;
		font-weight: 400;
	}

	.item-column {
		width: 55%;
	}
	.serial-column {
		width: 16%;
	}
	.quantity-column {
		width: 7%;
	}
	.rate-column {
		width: 10%;
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

	.totals {
		width: 40%;
		margin-left: auto;
		border: 1px solid #000;
	}

	.totals > div {
		display: flex;
		justify-content: space-between;
		padding: 3mm;
	}

	.totals > div + div {
		border-top: 1px solid #000;
	}

	.grand-total {
		font-size: 14px;
	}

	.warranty {
		margin-top: 6mm;
	}

	.warranty h3 {
		margin: 0 0 2mm;
		text-align: center;
		font-size: 11px;
	}

	.warranty p {
		margin: 0;
		font-size: 9px;
		line-height: 1.4;
		text-align: justify;
	}

	.signatures {
		display: grid;
		grid-template-columns: 1fr 1fr;
		margin-top: 8mm;
	}

	.sig {
		width: 60mm;
	}

	.sig-line {
		border-top: 1px solid #000;
		margin-bottom: 2mm;
	}

	.sig p {
		margin: 0;
		font-size: 10px;
	}

	.sig strong {
		font-size: 10px;
	}

	.sig-left {
		justify-self: start;
	}

	.sig-right {
		justify-self: end;
	}

	.sig-center {
		grid-column: 1 / -1;
		justify-self: center;
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
