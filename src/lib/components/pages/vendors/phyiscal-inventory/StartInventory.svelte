<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Sheet,
		SheetClose,
		SheetContent,
		SheetDescription,
		SheetFooter,
		SheetHeader,
		SheetTitle,
		SheetTrigger
	} from '$lib/components/ui/sheet';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Plus } from '@lucide/svelte';
	import type {
		ActionData,
		PageData
	} from '../../../../../routes/vendors/physical-inventory/$types';

	interface Props {
		data: PageData;
		form: ActionData;
	}
	let { data, form }: Props = $props();
	let errors = $derived(form?.errors);
</script>

<Sheet>
	<SheetTrigger class={buttonVariants({ variant: 'default' })}>
		<Plus class="size-4" />
		Start Inventory
	</SheetTrigger>
	<SheetContent class="overflow-x-hidden overflow-y-auto">
		<SheetHeader>
			<SheetTitle>Start Physical Inventory</SheetTitle>
			<SheetDescription>Create a new physical inventory count</SheetDescription>
		</SheetHeader>
		<form action="" method="post">
			<div class="flex flex-col gap-6 px-6">
				<div class="space-y-2">
					<Label>Physical Inventory Title</Label>
					<div>
						<Input
							class={errors?.properties?.title ? 'border-red-500' : ''}
							name="title"
							placeholder="e.g., Q1 2024 Full Count"
						/>
						{#if errors?.properties?.title}
							<small class="text-red-500">{errors.properties.title.errors[0]}</small>
						{/if}
					</div>
				</div>
				<div class="space-y-2">
					<Label>Notes</Label>
					<Textarea name="notes" placeholder="Add any notes about this inventory count" />
				</div>
			</div>
			<input type="hidden" name="created_by" value={data.auth_user?.id} />
			<SheetFooter class="flex-row justify-end">
				<SheetClose type="button" class={buttonVariants({ variant: 'outline' })}>Cancel</SheetClose>
				<Button type="submit">Start Inventory</Button>
			</SheetFooter>
		</form>
	</SheetContent>
</Sheet>
