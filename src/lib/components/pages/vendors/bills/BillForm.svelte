<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import {
		Select,
		SelectContent,
		SelectGroup,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';
	import {
		Sheet,
		SheetContent,
		SheetDescription,
		SheetHeader,
		SheetTitle,
		SheetTrigger
	} from '$lib/components/ui/sheet';
	import type { Supplier } from '$lib/types/global';
	import { Plus } from '@lucide/svelte';

	interface Props {
		suppliers: Supplier[];
	}

	let open = $state(false);
	let selectedSupplierId = $state('');
	let fetchPOBySupplier: HTMLFormElement;
	let selectedSupplier = $derived.by(() => {
		return suppliers.find((supplier) => supplier.id === parseInt(selectedSupplierId));
	});

	let { suppliers = [] }: Props = $props();
</script>

<form action="?/getSupplierRelatedPO" method="post" bind:this={fetchPOBySupplier}>
	<input type="hidden" name="supplier_id" value={selectedSupplierId} />
</form>

<Sheet bind:open>
	<SheetTrigger class={buttonVariants({ variant: 'default' })}>
		<Plus class="size-4" />
		Add Bill
	</SheetTrigger>
	<SheetContent
		trapFocus={false}
		side="right"
		class="overflow-x-hidden overflow-y-auto sm:!max-w-2xl"
	>
		<SheetHeader>
			<SheetTitle>Add New Bill</SheetTitle>
			<SheetDescription>Fill in the details to add a new bill</SheetDescription>
		</SheetHeader>
		<form action="" method="post">
			<div class="flex flex-col gap-6 px-6">
				<Card>
					<CardHeader>
						<CardTitle>Bill Details</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex flex-col gap-6">
							<div class="space-y-2">
								<Label>Supplier</Label>
								<div>
									<Select type="single" bind:value={selectedSupplierId}>
										<SelectTrigger class="w-full">
											{selectedSupplier ? selectedSupplier.name : 'Select supplier'}
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{#each suppliers as supplier (supplier.id)}
													<SelectItem value={supplier.id.toString()}>{supplier.name}</SelectItem>
												{/each}
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>
							</div>
							<div class="space-y-2">
								<Label>Linked PO</Label>
								<!-- <div>
									<Select type="single" bind:value={selectedSupplierId}>
										<SelectTrigger class="w-full">
											{selectedSupplier ? selectedSupplier.name : 'Select supplier'}
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{#each suppliers as supplier (supplier.id)}
													<SelectItem value={supplier.id.toString()}>{supplier.name}</SelectItem>
												{/each}
											</SelectGroup>
										</SelectContent>
									</Select>
								</div> -->
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</form>
	</SheetContent>
</Sheet>
