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
	import { Plus, Printer } from '@lucide/svelte';
	import FixAssetsItems from './fix-assets-items.svelte';
	import { page } from '$app/state';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { goto, invalidateAll } from '$app/navigation';
	import { applyAction, enhance } from '$app/forms';
	import type { FixAssetItem } from '$lib/types/global';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { FixAssetUser } from '$lib/const';
	import { capitalizeFirstLetter } from '$lib/utils/common';
	import { resolve } from '$app/paths';

	let { open = $bindable(false) } = $props();
	let auth = $derived(page.data?.auth_user);
	let errors = $derived(page.form?.errors?.properties || {});
	let fixAsset = $derived(page.data?.fixAsset);
	let isView = $derived(fixAsset ? true : false);

	// Form buffers are writable state: seeded from the viewed record and reset on
	// close, so they must not be derived.
	let dateTransfered = $state<string>('');
	let fixAssetUser = $state<string>('');
	let notes = $state<string>('');

	let items = $state<FixAssetItem[]>([]);

	// Seed (or reset) the buffers whenever a different record is opened or closed.
	let viewedAssetId = $state<number | null>(null);
	$effect(() => {
		const id = fixAsset?.id ?? null;
		if (id === viewedAssetId) return;
		viewedAssetId = id;
		dateTransfered = fixAsset?.date_transfered ?? '';
		fixAssetUser = fixAsset?.user ?? '';
		notes = fixAsset?.notes ?? '';
		items = fixAsset?.items ? structuredClone(fixAsset.items) : [];
	});

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

	const printFixAsset = async () => {
		await goto(resolve(`/vendors/transfers/fix-assets/print/${fixAsset?.id}`));
	};

	const onOpenChangeComplete = async () => {
		if (!open) {
			fixAssetUser = '';
			items = [];
			dateTransfered = '';
			notes = '';

			await goto(resolve('/vendors/transfers/fix-assets'));
		}
	};
</script>

<Sheet bind:open {onOpenChangeComplete}>
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
							{#if fixAsset?.id}
								<Button
									type="button"
									class="cursor-pointer"
									variant="outline"
									onclick={printFixAsset}
								>
									<Printer size={16} />
									Print
								</Button>
							{/if}
						</CardHeader>
						<CardContent>
							<div class="flex flex-col gap-6">
								<div class="space-y-2">
									<Label>Date Transfer</Label>
									<div>
										<DatePicker
											error={errors?.date_transfered ? true : false}
											name="date_transfered"
											bind:value={dateTransfered}
											disabled={isView}
										/>
										{#if errors?.date_transfered}
											<small class="text-red-500">{errors?.date_transfered.errors[0]}</small>
										{/if}
									</div>
								</div>
								<div class="space-y-2">
									<Label>User</Label>
									<div>
										<Select disabled={isView} type="single" name="user" bind:value={fixAssetUser}>
											<SelectTrigger class="w-full">
												{fixAssetUser ? capitalizeFirstLetter(fixAssetUser) : 'Select user'}
											</SelectTrigger>
											<SelectContent>
												{#each Object.values(FixAssetUser) as user (user)}
													<SelectItem value={user}>{capitalizeFirstLetter(user)}</SelectItem>
												{/each}
											</SelectContent>
										</Select>
										{#if errors?.user}
											<small class="text-red-500">{errors?.user.errors[0]}</small>
										{/if}
									</div>
								</div>
								<div class="space-y-2">
									<Label>Notes</Label>
									<Textarea
										name="notes"
										readonly={isView}
										bind:value={notes}
										placeholder="Add any additional notes about this transfer..."
									/>
								</div>
							</div>
							<input name="staff_user_id" type="hidden" value={auth?.id} />
						</CardContent>
					</Card>

					<FixAssetsItems bind:items {isView} />
				</div>
			</div>

			{#if !isView}
				<SheetFooter class="shrink-0 flex-row justify-end border-t bg-white p-4">
					<SheetClose type="button" class={buttonVariants({ variant: 'outline' })}>
						Cancel
					</SheetClose>
					<Button type="submit" disabled={!items.length} variant="default">Add Fix Asset</Button>
				</SheetFooter>
			{/if}
		</form>
	</SheetContent>
</Sheet>
