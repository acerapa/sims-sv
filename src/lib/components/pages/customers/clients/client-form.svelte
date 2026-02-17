<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Label from '$lib/components/ui/label/label.svelte';
	import {
		Sheet,
		SheetClose,
		SheetContent,
		SheetDescription,
		SheetHeader,
		SheetTitle,
		SheetTrigger
	} from '$lib/components/ui/sheet';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { Plus } from '@lucide/svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';

	let { open = $bindable<boolean>(false) } = $props();
	let errors = $derived(page.form?.errors);

	const enhanceForm: SubmitFunction = () => {
		return async ({ result }) => {
			await applyAction(result);
			if (result.type === 'success') {
				await invalidateAll();
				open = false;
				toast.success('Client added successfully');
			} else {
				toast.error('Failed to add client');
			}
		};
	};

	const onOpenChangeComplete = async (open: boolean) => {
		if (!open) {
			errors = null;
		}
	};
</script>

<Sheet bind:open {onOpenChangeComplete}>
	<SheetTrigger class={`${buttonVariants({ variant: 'default' })} cursor-pointer`}>
		<Plus class="size-4" />
		Add Client
	</SheetTrigger>
	<SheetContent side="right" class="overflow-x-hidden overflow-y-auto sm:max-w-md">
		<SheetHeader>
			<SheetTitle>Add Client</SheetTitle>
			<SheetDescription>Fill out the form below to add a new client.</SheetDescription>
		</SheetHeader>
		<form method="POST" action="/customers/clients?/addNewClient" use:enhance={enhanceForm}>
			<div class="space-y-4 px-4">
				<div class="space-y-2">
					<Label for="name">Name</Label>
					<div>
						<Input
							class={errors?.properties?.name ? 'border-red-500' : ''}
							id="name"
							name="name"
							type="text"
							placeholder="Enter client name"
						/>
						{#if errors?.properties?.name}
							<small class="text-red-500">{errors.properties.name.errors[0]}</small>
						{/if}
					</div>
				</div>
				<div class="space-y-2">
					<Label for="address">Address</Label>
					<div>
						<Textarea
							class={errors?.properties?.address ? 'border-red-500' : ''}
							id="address"
							name="address"
							placeholder="Enter client address"
						/>
						{#if errors?.properties?.address}
							<small class="text-red-500">{errors.properties.address.errors[0]}</small>
						{/if}
					</div>
				</div>
				<div class="space-y-2">
					<Label for="phone">Phone</Label>
					<div>
						<Input
							class={errors?.properties?.phone ? 'border-red-500' : ''}
							id="phone"
							name="phone"
							type="text"
							placeholder="Enter client phone"
						/>
						{#if errors?.properties?.phone}
							<small class="text-red-500">{errors.properties.phone.errors[0]}</small>
						{/if}
					</div>
				</div>
				<div class="space-y-2">
					<Label for="viber">Viber</Label>
					<div>
						<Input
							class={errors?.properties?.viber ? 'border-red-500' : ''}
							id="viber"
							name="viber"
							type="text"
							placeholder="Enter client viber"
						/>
						{#if errors?.properties?.viber}
							<small class="text-red-500">{errors.properties.viber.errors[0]}</small>
						{/if}
					</div>
				</div>
				<div class="space-y-2">
					<Label for="fb_account">FB account</Label>
					<div>
						<Input
							class={errors?.properties?.fb_account ? 'border-red-500' : ''}
							id="fb_account"
							name="fb_account"
							type="text"
							placeholder="Enter client fb account"
						/>
						{#if errors?.properties?.fb_account}
							<small class="text-red-500">{errors.properties.fb_account.errors[0]}</small>
						{/if}
					</div>
				</div>
				<div class="flex items-center justify-end gap-3">
					<SheetClose type="button">
						<Button type="button" variant="outline">Cancel</Button>
					</SheetClose>
					<Button type="submit">Add client</Button>
				</div>
			</div>
		</form>
	</SheetContent>
</Sheet>
