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

	let { open = $bindable(false) } = $props();
</script>

<Sheet bind:open>
	<SheetTrigger class={[buttonVariants({ variant: 'default' })]}>
		<Plus />
		Add RMA
	</SheetTrigger>
	<SheetContent side="right" class="overflow-x-hidden overflow-y-auto sm:!max-w-2xl">
		<SheetHeader>
			<SheetTitle>New Return Merchandise Authorization</SheetTitle>
			<SheetDescription>Fill in the details to add a new rma</SheetDescription>
		</SheetHeader>
	</SheetContent>
</Sheet>
