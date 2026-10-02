<script lang="ts">
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle,
		AlertDialogTrigger
	} from '$lib/components/ui/alert-dialog';
	import { buttonVariants } from '$lib/components/ui/button';

	let { open = $bindable<boolean>(false), soId = $bindable<number>(), onCancel = $bindable<() => void>() } = $props();
</script>

<AlertDialog bind:open>
	<AlertDialogTrigger
		class={buttonVariants({ variant: 'outline' }) +
			' cursor-pointer border-red-500 text-red-500 hover:text-red-500'}
	>
		Cancel
	</AlertDialogTrigger>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>{`Cancel Sales Order${soId ? ` SO-${soId}?` : '?'}`}</AlertDialogTitle>
			<AlertDialogDescription>
				This will mark the order as cancelled. Items will no longer be available to invoice from
				this order. This action cannot be undone.
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel>Keep Order</AlertDialogCancel>
			<AlertDialogAction onclick={onCancel} class={buttonVariants({ variant: 'destructive' })}>Yes, Cancel order</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
