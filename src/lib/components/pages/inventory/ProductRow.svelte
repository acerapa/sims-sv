<script>
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Ellipsis } from '@lucide/svelte';
</script>

<div
	class="flex w-full items-center rounded-lg bg-muted/30 p-4 transition-colors hover:bg-muted/50"
>
	<div class="grid w-full grid-cols-11 items-center gap-3">
		<div class="col-span-3 space-x-2">
			<p class="text-sm font-medium">Wireless Headphones</p>
			<p class="text-xs text-muted-foreground">SKU: 24635-GSF</p>
		</div>
		<p class="col-span-2 text-sm text-muted-foreground">Electronics</p>
		<p class="col-span-2 font-semibold">₱540.00</p>
		<div class="col-span-2 space-y-1">
			<p class="text-sm text-muted-foreground">
				<span>5</span>/10
			</p>
			<p class="text-xs text-muted-foreground">Current/Min</p>
		</div>
		<Badge variant="destructive" class="col-span-1 rounded-full px-3 py-1">Critical</Badge>
		<div class="col-span-1 text-end">
			<Button variant="ghost">
				<Ellipsis />
			</Button>
		</div>
	</div>
</div>
