<script lang="ts">
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

	let { open = $bindable<boolean>(false) } = $props();
</script>

<Sheet bind:open>
	<SheetTrigger class={`${buttonVariants({ variant: 'default' })} cursor-pointer`}>
		<Plus class="size-4" />
		Add Client
	</SheetTrigger>
	<SheetContent side="right" class="overflow-x-hidden overflow-y-auto sm:max-w-md">
		<SheetHeader>
			<SheetTitle>Add Client</SheetTitle>
			<SheetDescription>Fill out the form below to add a new client.</SheetDescription>
		</SheetHeader>
		<form>
			<div class="space-y-4 px-4">
				<div class="space-y-2">
					<Label for="name">Name</Label>
					<div>
						<Input id="name" name="name" type="text" placeholder="Enter client name" />
					</div>
				</div>
				<div class="space-y-2">
					<Label for="address">Address</Label>
					<div>
						<Textarea id="address" name="address" placeholder="Enter client address" />
					</div>
				</div>
				<div class="space-y-2">
					<Label for="phone">Phone</Label>
					<div>
						<Input id="phone" name="phone" type="text" placeholder="Enter client phone" />
					</div>
				</div>
				<div class="space-y-2">
					<Label for="viber">Viber</Label>
					<div>
						<Input id="viber" name="viber" type="text" placeholder="Enter client viber" />
					</div>
				</div>
				<div class="space-y-2">
					<Label for="fb_account">FB account</Label>
					<div>
						<Input
							id="fb_account"
							name="fb_account"
							type="text"
							placeholder="Enter client fb account"
						/>
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
