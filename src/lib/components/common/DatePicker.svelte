<script lang="ts">
	import { fromDate, getLocalTimeZone, type DateValue } from '@internationalized/date';
	import { buttonVariants } from '../ui/button';
	import { Calendar } from '../ui/calendar';
	import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
	import { CalendarIcon } from '@lucide/svelte';

	let {
		value = $bindable<Date>(),
		name = $bindable<string>(),
		error = false,
		disabled = $bindable<boolean>(false)
	} = $props();
	let selectedDate = $state<DateValue | undefined>(
		value ? fromDate(value, getLocalTimeZone()) : undefined
	);

	$effect(() => {
		if (selectedDate) {
			value = selectedDate.toDate(getLocalTimeZone());
		}
	});
</script>

<Popover>
	<PopoverTrigger
		{disabled}
		class={[
			'flex w-full items-center !justify-start !font-normal disabled:!opacity-100',
			buttonVariants({ variant: 'outline' }),
			value ? 'text-primary' : 'text-muted-foreground',
			error ? 'border-red-500' : ''
		]}
	>
		<CalendarIcon />
		{value
			? value.toLocaleDateString('default', {
					day: 'numeric',
					month: 'long',
					year: 'numeric'
				})
			: 'Select Date'}
	</PopoverTrigger>
	<PopoverContent>
		<Calendar bind:value={selectedDate} type="single" captionLayout="dropdown" />
	</PopoverContent>
	<input type="hidden" {name} {value} />
</Popover>
