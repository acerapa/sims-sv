<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Printer } from '@lucide/svelte';

	let {
		reportTitle,
		dateRange,
		children
	}: {
		reportTitle: string;
		dateRange?: { from?: string; to?: string };
		children: Snippet;
	} = $props();

	function formatDateLabel(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('default', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function handlePrint() {
		window.print();
	}
</script>

<div class="print-page">
	<div class="no-print mb-6 flex justify-end">
		<button
			onclick={handlePrint}
			class="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
		>
			<Printer size={16} />
			Print
		</button>
	</div>

	<div class="print-header">
		<div class="company-info">
			<h1 class="company-name">RAM TECH VENTURES INC.</h1>
			<p>BARTOLOME BLDG. MAGSAYSAY ST.</p>
			<p>BRGY. EAST AWANG</p>
			<p>CALBAYOG, PA 6710</p>
		</div>
	</div>

	<div class="report-title-section">
		<h2 class="report-title">{reportTitle}</h2>
		{#if dateRange?.from || dateRange?.to}
			<p class="date-range">
				{#if dateRange.from && dateRange.to}
					{formatDateLabel(dateRange.from)} — {formatDateLabel(dateRange.to)}
				{:else if dateRange.from}
					From {formatDateLabel(dateRange.from)}
				{:else if dateRange.to}
					Up to {formatDateLabel(dateRange.to)}
				{/if}
			</p>
		{:else}
			<p class="date-range">All Dates</p>
		{/if}
	</div>

	<div class="report-body">
		{@render children()}
	</div>

	<div class="report-footer">
		<p>Generated on {new Date().toLocaleDateString('default', { day: 'numeric', month: 'long', year: 'numeric' })} at {new Date().toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' })}</p>
	</div>
</div>

<style>
	.print-page {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
		font-family: Arial, Helvetica, sans-serif;
		color: #000;
	}

	.print-header {
		margin-bottom: 1.5rem;
	}

	.company-info {
		text-align: left;
	}

	.company-name {
		font-size: 1.25rem;
		font-weight: 700;
		border: 2px solid #000;
		display: inline-block;
		padding: 0.25rem 0.75rem;
		margin-bottom: 0.5rem;
	}

	.company-info p {
		font-size: 0.8rem;
		line-height: 1.4;
		margin: 0;
	}

	.report-title-section {
		border-top: 1px solid #000;
		border-bottom: 1px solid #000;
		padding: 0.5rem 0;
		margin-bottom: 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.report-title {
		font-size: 1.1rem;
		font-weight: 700;
		margin: 0;
	}

	.date-range {
		font-size: 0.8rem;
		color: #444;
		margin: 0;
	}

	.report-body {
		min-height: 300px;
	}

	.report-footer {
		margin-top: 2rem;
		padding-top: 0.75rem;
		border-top: 1px solid #ccc;
		text-align: right;
		font-size: 0.7rem;
		color: #666;
	}

	/* Print-specific styles */
	@media print {
		.no-print {
			display: none !important;
		}

		.print-page {
			max-width: 100%;
			padding: 0;
			margin: 0;
		}

		.report-footer {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			padding: 0.5rem 1rem;
			border-top: 1px solid #ccc;
			background: #fff;
		}
	}

	/* Global print table styles (applied via :global for child content) */
	:global(.print-table) {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8rem;
	}

	:global(.print-table th),
	:global(.print-table td) {
		border: 1px solid #000;
		padding: 0.35rem 0.5rem;
		text-align: left;
	}

	:global(.print-table th) {
		background-color: #f0f0f0;
		font-weight: 600;
		font-size: 0.75rem;
	}

	:global(.print-table .text-right) {
		text-align: right;
	}

	:global(.print-table .font-bold) {
		font-weight: 700;
	}

	:global(.print-table tfoot td) {
		font-weight: 700;
		background-color: #f5f5f5;
	}

	:global(.print-section-title) {
		font-size: 0.95rem;
		font-weight: 700;
		margin: 1.5rem 0 0.5rem;
		padding-bottom: 0.25rem;
		border-bottom: 1px solid #999;
	}

	:global(.print-section-title:first-child) {
		margin-top: 0;
	}

	:global(.print-po-header) {
		font-size: 0.8rem;
		color: #333;
		margin: 0.75rem 0 0.25rem;
		display: flex;
		gap: 1rem;
	}

	:global(.print-po-header .po-ref) {
		font-weight: 600;
	}

	:global(.print-vendor-subtotal) {
		text-align: right;
		font-weight: 700;
		font-size: 0.85rem;
		margin-top: 0.5rem;
		padding-top: 0.25rem;
		border-top: 1px solid #999;
	}

	:global(.page-break) {
		page-break-before: always;
	}
</style>
