<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Item, ItemContent, ItemDescription, ItemTitle } from '$lib/components/ui/item';
	import { Trash } from '@lucide/svelte';
</script>

<Item variant="outline">
	<ItemContent>
		<div class="flex gap-3">
			<div class="flex-1">
				<ItemTitle>Test Product</ItemTitle>
				<ItemDescription>1---.--</ItemDescription>
			</div>
			<Button
				variant="ghost"
				size="icon"
				class="cursor-pointer"
			>
				<Trash class="text-red-500" />
			</Button>
		</div>
	</ItemContent>
</Item>
