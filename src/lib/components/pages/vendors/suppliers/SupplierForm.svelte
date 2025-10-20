<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import {
		Drawer,
		DrawerContent,
		DrawerDescription,
		DrawerFooter,
		DrawerHeader,
		DrawerTitle
	} from '$lib/components/ui/drawer';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';

	let { open = $bindable() } = $props();
</script>

<Drawer direction="right" bind:open>
	<DrawerContent
		class="overflow-x-hidden overflow-y-auto sm:!max-w-2xl"
		draggable={false}
		data-vaul-no-drag
	>
		<DrawerHeader class="px-6">
			<DrawerTitle class="text-xl">Add New Supplier</DrawerTitle>
			<DrawerDescription>Fill in the details to add a new supplier</DrawerDescription>
		</DrawerHeader>

		<form>
			<div class="mt-5 flex flex-col gap-6 px-6">
				<Card>
					<CardHeader>
						<CardTitle>Basic Information</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="space-y-2">
							<Label for="name">Supplier Name</Label>
							<Input id="name" type="text" placeholder="Enter Supplier Name" />
						</div>
						<div class="space-y-2">
							<Label for="contact_person">Contact Person</Label>
							<Input id="contact_person" type="text" placeholder="Enter Contact Person" />
						</div>
						<div class="space-y-2">
							<Label for="address">Address</Label>
							<Textarea id="address" placeholder="Enter address" />
						</div>
						<div class="space-y-2">
							<Label for="notes">Notes</Label>
							<Textarea id="notes" placeholder="Enter notes" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Contact Information</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="space-y-2">
							<Label for="email">Email</Label>
							<Input id="email" type="email" placeholder="email@example.com" />
						</div>
						<div class="space-y-2">
							<Label for="phone">Phone</Label>
							<Input id="phone" type="text" placeholder="+63 " />
						</div>
						<div class="space-y-2">
							<Label for="telephone">Telephone</Label>
							<Input id="telephone" type="text" placeholder="(655) 123-4567" />
						</div>
					</CardContent>
				</Card>
			</div>
			<DrawerFooter class="flex flex-row justify-end">
				<Button type="button" variant="outline">Cancel</Button>
				<Button type="button" variant="default">Add Product</Button>
			</DrawerFooter>
		</form>
	</DrawerContent>
</Drawer>
