<script lang="ts">
	import DatePicker from '$lib/components/common/DatePicker.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import {
		Sheet,
		SheetContent,
		SheetDescription,
		SheetHeader,
		SheetTitle,
		SheetTrigger
	} from '$lib/components/ui/sheet';
	import { Plus } from '@lucide/svelte';
	import STRItems from './STRItems.svelte';

	let { stores } = $props();
	let storeId = $state('');
	let selectedStore = $derived.by(() => stores.find((store) => store.id === parseInt(storeId)));
</script>

<Sheet>
	<SheetTrigger class={[buttonVariants({ variant: 'default' })]}>
		<Plus />
		Add STR
	</SheetTrigger>
	<SheetContent side="right" class="overflow-x-hidden overflow-y-auto sm:!max-w-2xl">
		<SheetHeader>
			<SheetTitle>New Stock Transfer Request</SheetTitle>
			<SheetDescription>Fill in the details to add a new str</SheetDescription>
		</SheetHeader>

		<form action="" method="post">
			<div class="flex flex-col gap-6 px-6">
				<Card>
					<CardHeader>
						<CardTitle>STR Information</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex flex-col gap-6">
							<div class="space-y-2">
								<Label>Destination</Label>
								<Select type="single" bind:value={storeId}>
									<SelectTrigger class={['w-full']}>
										{selectedStore ? selectedStore.name : 'Select Store'}
									</SelectTrigger>
									<SelectContent>
										{#each stores as store (store.id)}
											<SelectItem value={store.id}>{store.name}</SelectItem>
										{/each}
									</SelectContent>
								</Select>
							</div>
							<div class="space-y-2">
								<Label>Transfer date</Label>
								<DatePicker />
							</div>
						</div>
					</CardContent>
				</Card>
				<STRItems />
			</div>
		</form>
	</SheetContent>
</Sheet>
