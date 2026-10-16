<script lang="ts">
	import DatePicker from '$lib/components/common/DatePicker.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import {
		Sheet,
		SheetClose,
		SheetContent,
		SheetDescription,
		SheetFooter,
		SheetHeader,
		SheetTrigger
	} from '$lib/components/ui/sheet';
	import SheetTitle from '$lib/components/ui/sheet/sheet-title.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Plus } from '@lucide/svelte';
	import FixAssetsItems from './fix-assets-items.svelte';
	import { page } from '$app/state';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import { applyAction, enhance } from '$app/forms';
	import type { FixAssetItem } from '$lib/types/global';

	let { open = $bindable(false) } = $props();
	let auth = $derived(page.data?.auth_user);
	let errors = $derived(page.form?.errors?.properties || {});

	let items = $state<FixAssetItem[]>([]);

	const enhanceForm: SubmitFunction = () => {
		return async ({ result }) => {
			await applyAction(result);
			if (result.type === 'success') {
				toast.success('Fix asset successfully submitted!');
				await invalidateAll();
				open = false;
			} else {
				toast.error('Error submitting fix assets!');
			}
		};
	};
</script>

<Sheet bind:open>
	<SheetTrigger class={buttonVariants({ variant: 'default' })}>
		<Plus />
		Add Fix Assets
	</SheetTrigger>
	<SheetContent side="right" class="flex flex-col gap-0 p-0 sm:max-w-3xl">
		<SheetHeader class="shrink-0 p-6">
			<SheetTitle>New Fix Assets</SheetTitle>
			<SheetDescription>Fill in the details to create a new fix assets</SheetDescription>
		</SheetHeader>

		<form
			class="flex min-h-0 flex-1 flex-col"
			method="POST"
			action="/vendors/transfers/fix-assets?/submitFixAsset"
			use:enhance={enhanceForm}
		>
			<!-- Only this area scrolls -->
			<div class="flex-1 overflow-y-auto">
				<div class="flex flex-col gap-6 px-6 pb-6">
					<Card>
						<CardHeader class="flex items-center justify-between">
							<CardTitle>Fix Asset Information</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="flex flex-col gap-6">
								<div class="space-y-2">
									<Label>Date Transfer</Label>
									<div>
										<DatePicker
											error={errors?.date_transfered ? true : false}
											name="date_transfered"
										/>
										{#if errors?.date_transfered}
											<small class="text-red-500">{errors?.date_transfered.errors[0]}</small>
										{/if}
									</div>
								</div>
								<div class="space-y-2">
									<Label>Notes</Label>
									<Textarea
										name="notes"
										placeholder="Add any additional notes about this transfer..."
									/>
								</div>
							</div>
							<input name="staff_user_id" type="hidden" value={auth?.id} />
						</CardContent>
					</Card>

					<FixAssetsItems bind:items={items} />
				</div>
			</div>

			<SheetFooter class="shrink-0 flex-row justify-end border-t bg-white p-4">
				<SheetClose type="button" class={buttonVariants({ variant: 'outline' })}>Cancel</SheetClose>
				<Button type="submit" disabled={!items.length} variant="default">Add Fix Asset</Button>
			</SheetFooter>
		</form>
	</SheetContent>
</Sheet>
