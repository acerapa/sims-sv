<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import {
		Select,
		SelectContent,
		SelectGroup,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';
</script>

<svelte:head>
	<title>RamTech | Sales Orders Form</title>
	<meta name="description" content="Sales orders form" />
</svelte:head>

<form>
	<div class="mb-6 flex flex-col gap-6">
		<Card>
			<CardHeader>
				<CardTitle>Create Sales Order</CardTitle>
				<CardDescription>Create a new sales order for a customer.</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="flex flex-col gap-6">
					<div class="flex gap-6">
						<div class="flex flex-col gap-2">
							<Label>Customer</Label>
							<Select type="single" name="customer_id">
								<SelectTrigger>Select Customer</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value="1">Test</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>
</form>
