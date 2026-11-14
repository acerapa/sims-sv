<script lang="ts">
	import { applyAction, enhance, type SubmitFunction } from '$app/forms';
	import Button from '#lib/components/ui/button/button.svelte';
	import Input from '#lib/components/ui/input/input.svelte';
	import { Check, Folder, X } from '@lucide/svelte';
	import { slide } from 'svelte/transition';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { refreshAll } from '$app/navigation';

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

	const enhanceForm: SubmitFunction = () => {
		if (submitting) return;
		submitting = true;
		return async ({ result }) => {
			await applyAction(result);
			if (result.type === 'success') {
			    open = false
				await refreshAll();
				toast.success('Category successfully added!');
			} else {
				toast.error('Failed to add category!');
			}

			submitting = false;
			if (onSubmitted) onSubmitted();
		};
	};
</script>

<form
	method="post"
	action="/vendors/categories"
	use:enhance={enhanceForm}
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
