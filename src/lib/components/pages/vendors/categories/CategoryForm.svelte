<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Check, Folder, X } from '@lucide/svelte';
	import { slide } from 'svelte/transition';
	import { page } from '$app/state';

	interface Props {
		parent_id?: number | null;
		open?: boolean;
		onSubmitted?: () => void;
	}

	let form = $derived(page.form);
	let { parent_id = null, open = $bindable(false), onSubmitted }: Props = $props();
	let errors = $derived(form?.errors);
	let submitting = $state(false);

	const handleCloseForm = () => {
		open = false;
		if (form) {
			form = null;
		}
	};
</script>

<form
	method="post"
	action="/vendors/categories"
	use:enhance={() => {
		if (submitting) return;
		submitting = true;
		return async ({ update }) => {
			await update();
			submitting = false;
			if (onSubmitted) onSubmitted();
		};
	}}
	class="ml-4 flex items-center gap-3"
	transition:slide
>
	<Folder class="size-4" />
	<Input
		name="name"
		class={['flex-1', errors?.properties?.name ? 'border-red-500' : '']}
		placeholder="New Category"
	/>
	<Input type="hidden" name="parent_id" value={parent_id} />
	<div class="flex items-center gap-2">
		<Button
			variant="ghost"
			type="submit"
			disabled={submitting}
			class="size-7 cursor-pointer hover:bg-green-500/10"
		>
			<Check class="text-green-500" />
		</Button>
		<Button
			onclick={handleCloseForm}
			variant="ghost"
			type="button"
			class="size-7 cursor-pointer hover:bg-red-500/10"
		>
			<X class="text-red-500" />
		</Button>
	</div>
</form>
