<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import {
		Sheet,
		SheetContent,
		SheetDescription,
		SheetHeader,
		SheetTitle,
		SheetTrigger
	} from '$lib/components/ui/sheet';
	import { Plus } from '@lucide/svelte';
</script>

<Sheet>
	<SheetTrigger class={[buttonVariants({ variant: 'default' })]}>
		<Plus />
		Add IBRR
	</SheetTrigger>
	<SheetContent side="right" class="overflow-x-hidden overflow-y-auto sm:!max-w-2xl">
		<SheetHeader>
			<SheetTitle>New Inter-Branch Receiving Report</SheetTitle>
			<SheetDescription>Fill in the details to add a new ibrr</SheetDescription>
		</SheetHeader>
	</SheetContent>
</Sheet>
