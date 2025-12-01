<script lang="ts">
	import STRForm from '$lib/components/pages/vendors/transfers/STRForm.svelte';
	import { Card, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="space-y-2">
				<CardTitle>Stock Transfer Requests</CardTitle>
				<CardDescription>Track and manage inventory transfers between locations</CardDescription>
			</div>
			<STRForm />
		</div>
	</CardHeader>
</Card>
