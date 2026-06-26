<script lang="ts">
	import { page } from '$app/state';
	import PrintReportLayout from '$lib/components/common/PrintReportLayout.svelte';

	const str = $derived(page.data?.str);
</script>

<PrintReportLayout reportTitle="Stock Transfer Report">
	<section class="flex flex-col gap-3">
		<div class="flex gap-5">
			<div class="flex-1 border-b border-muted-foreground py-1">
				<p class="text-xs font-bold text-muted-foreground">STR REFERENCE NO.</p>
				<p>STR-{str?.id}</p>
			</div>
			<div class="flex-1 border-b border-muted-foreground py-1">
				<p class="text-xs font-bold text-muted-foreground">TRANSFER DATE</p>
				<p>
					{str?.transfer_date.toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</p>
			</div>
		</div>
		<div class="flex gap-5">
			<div class="w-[calc(50%_-_10px)] border-b border-muted-foreground py-1">
				<p class="text-xs font-bold text-muted-foreground">DESTINATION</p>
				<p>{str?.store_name}</p>
			</div>
		</div>
		<div class="flex gap-5">
			<div class="flex-1 py-1">
				<p class="text-xs font-bold text-muted-foreground">DESTINATION</p>
				<div class="min-h-12 rounded border border-muted-foreground p-2">
					{str?.notes ? str?.notes : '---'}
				</div>
			</div>
		</div>
	</section>
</PrintReportLayout>
