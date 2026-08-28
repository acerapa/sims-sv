<script lang="ts">
	import { Printer } from "@lucide/svelte";
	import type { Snippet } from "svelte";

    interface Props {
      reportTitle: string;
      children: Snippet
    }

	let { reportTitle, children }: Props = $props();

	const reportDate = $derived.by(() => {
		const date = new Date();
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(date);
	});

	const handlePrint = () => {
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

    <div class="flex items-center justify-between">
		<p>{reportTitle}</p>
    	<p>Generated: {reportDate}</p>
    </div>

    <div class="report-body">
		{@render children()}
	</div>

	<div class="report-footer">
		<p>
			Generated on {new Date().toLocaleDateString('default', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			})} at {new Date().toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' })}
		</p>
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

	@media print {
		.no-print {
			display: none !important;
		}
	}
</style>
