<script lang="ts">
	import CategoryForm from '$lib/components/pages/vendors/categories/CategoryForm.svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Search } from '@lucide/svelte';
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="space-y-2">
				<CardTitle>Categories</CardTitle>
				<CardDescription>Browse category hierarchy</CardDescription>
			</div>
			<CategoryForm />
		</div>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="relative">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input type="search" placeholder="Search suppliers..." class="h-10 pl-9" />
		</div>
	</CardContent>
</Card>
