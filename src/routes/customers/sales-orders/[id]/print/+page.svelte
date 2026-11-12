<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { formatCurrency, formatPlainCurrency } from '#lib/utils/common.ts';
	import { openAndPrint } from '#lib/utils/pdf.ts';
	import type { PageProps } from './$types';
	import {
		buildDrPdf,
		drSpacerRows,
		formatDateShort,
		serialWPercent,
		totalWPercent,
		upWPercent,
		WARRANTY_TEXT
	} from './pdf';
	import type { DrPaperFormat } from './pdf';

	let { data }: PageProps = $props();
	let order = $derived(data.salesOrder);
	let paperFormat = $state<DrPaperFormat>('letter');
	// Serial No. column sizes to the receipt’s longest value (same fit as the PDF); Item Description absorbs it
	let serialPct = $derived(
		serialWPercent(order.items.map((item) => String(item.serial_number ?? '')))
	);
	let subtotal = $derived(
		order.items.reduce((sum, item) => sum + Number(item.total_price || 0), 0)
	);
	// UP/Total size to the receipt's widest amount (same fit as the PDF); Item Description absorbs them
	let upPct = $derived(upWPercent(order.items));
	let amountPct = $derived(totalWPercent(order.items, subtotal, order.total_cost));
	// Mirror the PDF: blank rows stretch the items table so the warranty + signatures close the page
	let spacerRows = $derived(
		Array.from({ length: drSpacerRows(order.items.length, undefined, paperFormat) }, (_, i) => i)
	);

	async function handlePrint() {
		openAndPrint(await buildDrPdf(order, paperFormat));
	}

	// <style> content is never parsed as a Svelte template, so the @page size can't be
	// dynamic in the scoped style — keep that one rule in a head <style> that follows the toggle
	function pageStyle(_el: HTMLElement, format: DrPaperFormat) {
		const rule = (f: DrPaperFormat) => `@page { size: ${f} portrait; margin: 8mm; }`;
		const style = document.createElement('style');
		style.textContent = rule(format);
		document.head.appendChild(style);
		return {
			update(next: DrPaperFormat) {
				style.textContent = rule(next);
			},
			destroy() {
				style.remove();
			}
		};
	}
</script>

<svelte:head>
	<title>Print D.R. SO-{order.id}</title>
</svelte:head>

<div class="receipt-page" class:legal={paperFormat === 'legal'} use:pageStyle={paperFormat}>
	<div class="no-print mb-4 flex items-center justify-between">
		<Button variant="outline" onclick={() => goto(resolve('customers/sales-orders'))}
			>Back to Sales Orders</Button
		>

		<div class="flex items-center gap-2">
			<label for="dr-paper-size" class="text-sm text-muted-foreground">Paper size</label>
			<select
				id="dr-paper-size"
				class="h-9 rounded-md border border-input bg-background px-3 text-sm"
				bind:value={paperFormat}
			>
				<option value="letter">Letter</option>
				<option value="legal">Legal</option>
			</select>
			<Button onclick={handlePrint}>Print</Button>
		</div>
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
				<tbody>
					<tr>
						<td>
							<span class="cell-label">DATE</span>
							{formatDateShort(order.date_ordered)}
						</td>
						<td>
							<span class="cell-label">S.O. NO.</span>
							{order.id}
						</td>
					</tr>
					<tr>
						<td><span class="cell-label">P.O. NO.</span></td>

						<td>
							<span class="cell-label">REP</span>
							{order.staff?.name || ''}
						</td>
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
				<th class="serial-column" style="width: {serialPct}%">Serial No.</th>
				<th class="quantity-column">Qty</th>
				<th class="rate-column" style="width: {upPct}%">UP</th>
				<th class="amount-column" style="width: {amountPct}%">Total</th>
			</tr>
		</thead>
		<tbody>
			{#each order.items as item (item.id)}
				<tr>
					<td class="!border-t-transparent !border-b-transparent"
						>{item.package?.name || item.product?.sales_description || '—'}</td
					>
					<td class="!border-t-transparent !border-b-transparent">{item.serial_number || ''}</td>
					<td class="number !border-t-transparent !border-b-transparent">{item.quantity}</td>
					<td class="number !border-t-transparent !border-b-transparent"
						>{formatPlainCurrency(item.unit_price)}</td
					>
					<td class="number !border-t-transparent !border-b-transparent"
						>{formatPlainCurrency(item.total_price)}</td
					>
				</tr>
			{/each}
			{#each spacerRows as spacerIndex (spacerIndex)}
				<tr class="spacer-row">
					<td class="!border-t-transparent !border-b-transparent"></td>
					<td class="!border-t-transparent !border-b-transparent"></td>
					<td class="number !border-t-transparent !border-b-transparent"></td>
					<td class="number !border-t-transparent !border-b-transparent"></td>
					<td class="number !border-t-transparent !border-b-transparent"></td>
				</tr>
			{/each}
			<!-- Total rows are ruled (client, 2026-11): top, between, and bottom borders close the table above the warranty -->
			<tr class="subtotal-row">
				<td colspan="4"><strong>SUB-TOTAL</strong></td>
				<td class="number">{formatCurrency(subtotal)}</td>
			</tr>
			<tr class="grand-row">
				<td colspan="4"><strong>TOTAL AMOUNT</strong></td>
				<td class="number"><strong>{formatCurrency(order.total_cost)}</strong></td>
			</tr>
		</tbody>
	</table>

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
		/* client 2026-10-30: larger text across the document */
		font-size: 12px;
	}

	/* Legal paper is 14in tall vs letter's 11in — keep the preview page as tall as the PDF */
	.receipt-page.legal {
		min-height: 356mm;
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
		/* client 2026-10-30: bold, no border box */
		margin: 0;
		font-size: 18px;
		font-weight: 700;
	}

	.company p {
		margin: 0;
		font-size: 11px;
		line-height: 1.3;
	}

	.title-area {
		text-align: center;
	}

	.dr-title {
		margin: 0 0 3mm;
		font-size: 26px;
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
		width: 38%;
		margin-left: auto;
		font-size: 9px;
	}

	.reference-table td {
		text-align: left;
		padding: 1.2mm 1.5mm;
	}

	.cell-label {
		display: block;
		font-size: 8px;
		font-weight: 700;
	}

	.name-address {
		width: 48%;
		min-height: 18mm; /* content-sized — matches the PDF's 50pt-min box that grows per address line */
		height: auto;
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
		/* flex column: absorbs whatever the Serial No. column takes (mirrors the PDF) */
	}
	.serial-column {
		width: 16%; /* inline style overrides with the fit from serialWPercent() */
	}
	.quantity-column {
		width: 7%;
	}
	.rate-column {
		width: 10.5%; /* fallback — inline style overrides with the fit from upWPercent() */
	}
	.amount-column {
		width: 15.4%; /* fallback — inline style overrides with the fit from totalWPercent() */
	}

	.items-table tbody td {
		height: 9mm;
		vertical-align: top;
	}

	/* Client 2026-11-09: items sit flush vertically in their rows; small x padding keeps
	   them readable and aligned with the header/totals columns */
	.items-table tbody tr:not(.subtotal-row):not(.grand-row) td {
		padding: 0 2mm;
	}

	/* Client 2026-11-09: compact item rows (5mm, mirrors the PDF's ITEM_ROW_HEIGHT);
	   spacer rows keep 9mm so they absorb the freed space */
	.items-table tbody tr:not(.spacer-row):not(.subtotal-row):not(.grand-row) td {
		height: 5mm;
	}

	.items-table .number {
		text-align: right;
		white-space: nowrap;
	}

	/* Total rows: bordered block (client, 2026-11) — top rule, shared rule, and a bottom rule */
	.subtotal-row td,
	.grand-row td {
		border-top: 1px solid #000;
	}

	/* Client 2026-11-09: the totals rows read as clean label/amount lines — no internal
	   vertical dividers, only the table's outer edges */
	.subtotal-row td,
	.grand-row td {
		border-left: none;
		border-right: none;
	}

	.subtotal-row td:first-child,
	.grand-row td:first-child {
		border-left: 1px solid #000;
	}

	.subtotal-row td:last-child,
	.grand-row td:last-child {
		border-right: 1px solid #000;
	}

	/* The row above SUB-TOTAL carries a transparent bottom (Tailwind util, !important in
	   @layer utilities); with collapsed borders its color wins the shared 1px slot and would
	   erase the totals block's top rule. Layered !important beats unlayered !important, so
	   this rule must sit in an earlier layer (components) to force the shared rule. */
	@layer components {
		tr:has(+ .subtotal-row) td {
			border-bottom: 1px solid #000 !important;
		}
	}

	.grand-row td {
		border-bottom: 1px solid #000;
	}

	.warranty {
		margin-top: 8mm;
	}

	.warranty h3 {
		margin: 0 0 2mm;
		text-align: center;
		font-size: 12px;
	}

	.warranty p {
		margin: 0;
		font-size: 10px;
		line-height: 1.45;
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
		font-size: 11px;
	}

	.sig strong {
		font-size: 11px;
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
