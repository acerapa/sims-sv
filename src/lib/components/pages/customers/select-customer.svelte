<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import {
		Command,
		CommandEmpty,
		CommandGroup,
		CommandInput,
		CommandItem,
		CommandList
	} from '$lib/components/ui/command';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import type { LabelValueProps } from '$lib/types/global';
	import { tick } from 'svelte';
	import ClientForm from './clients/client-form.svelte';

	let {
		value = $bindable<string>(),
		className = $bindable<string>(''),
		customers = $bindable<LabelValueProps[]>([])
	} = $props();

	let open = $state(false);
	let customerFormOpen = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);
	let selectValueLabel = $derived(customers.find((c) => c.value === value)?.label ?? '');

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}

	function onSuccess(clientId: number) {
		customerFormOpen = false;
		value = clientId;
	}
</script>

<ClientForm hasTrigger={false} bind:open={customerFormOpen} {onSuccess} />
<Popover bind:open>
	<PopoverTrigger
		bind:ref={triggerRef}
		class={buttonVariants({ variant: 'outline' }) + ' ' + className}
	>
		{selectValueLabel || 'Select Customer'}
	</PopoverTrigger>

	<PopoverContent align="start" class="p-0">
		<Command>
			<CommandInput placeholder="Search Customer..." />
			<CommandList>
				<CommandEmpty>No Customer Found</CommandEmpty>
				<CommandItem
					onSelect={() => {
						open = false;
						customerFormOpen = true;
					}}
				>
					Add Customer
				</CommandItem>
				<CommandGroup>
					{#each customers as customer (customer.value)}
						<CommandItem
							value={customer.label}
							aria-checked={value === customer.value}
							onSelect={() => {
								value = customer.value;
								closeAndFocusTrigger();
							}}
						>
							{customer.label}
						</CommandItem>
					{/each}
				</CommandGroup>
			</CommandList>
		</Command>
	</PopoverContent>
</Popover>
