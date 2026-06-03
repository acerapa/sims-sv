<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { CommandInput } from '$lib/components/ui/command';
	import { Plus } from '@lucide/svelte';
	import CategoryForm from './CategoryForm.svelte';

	let { searchQuery = $bindable('') } = $props();
	let showAddNewCategory = $state(false);

	const handleSubmitted = () => {
		showAddNewCategory = false;
	};
</script>

<div>
	<div class="flex items-center [&>div]:flex-1">
		<CommandInput bind:value={searchQuery} type="search" placeholder="Search category..." />
		<Button
			class="text-blue-500 hover:text-blue-700"
			variant="ghost"
			size="icon-sm"
			onclick={() => (showAddNewCategory = true)}
		>
			<Plus />
		</Button>
	</div>
	{#if showAddNewCategory}
		<div class="[&_form]:ml-2">
			<CategoryForm bind:open={showAddNewCategory} onSubmitted={handleSubmitted} />
		</div>
	{/if}
</div>
