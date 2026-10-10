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
	import LineItem from '../line-item.svelte';

	let { open = $bindable(false) } = $props();
</script>

<Sheet bind:open>
	<SheetTrigger class={buttonVariants({ variant: 'default' })}>
		<Plus />
		Add Fix Assets
	</SheetTrigger>
	<SheetContent side="right" class="overflow-x-hidden overflow-y-auto sm:max-w-3xl">
		<SheetHeader>
			<SheetTitle>New Fix Assets</SheetTitle>
			<SheetDescription>Fill in the details to create a new fix assets</SheetDescription>
		</SheetHeader>

		<form>
			<div class="flex flex-col gap-6 px-6">
				<Card>
					<CardHeader class="flex items-center justify-between">
						<CardTitle>Fix Asset Information</CardTitle>
					</CardHeader>

					<CardContent>
						<div class="flex flex-col gap-6">
							<div class="space-y-2">
								<Label>Date Transfer</Label>
								<DatePicker />
							</div>
							<div class="space-y-2">
								<Label>Notes</Label>
								<Textarea
									name="notes"
									placeholder="Add any additional notes about this transfer..."
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				<LineItem />
			</div>

			<SheetFooter class="flex-row justify-end">
				<SheetClose type="button" class={buttonVariants({ variant: 'outline' })}>Cancel</SheetClose>
				<Button type="submit" variant="default">Add Fix Asset</Button>
			</SheetFooter>
		</form>
	</SheetContent>
</Sheet>
