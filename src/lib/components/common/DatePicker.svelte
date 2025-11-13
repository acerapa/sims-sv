<script lang="ts">
	import { getLocalTimeZone, type DateValue } from '@internationalized/date';
	import { buttonVariants } from '../ui/button';
	import { Calendar } from '../ui/calendar';
	import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
	import { CalendarIcon } from '@lucide/svelte';

	let { value = $bindable<Date>(), name = $bindable<string>(), error = false } = $props();
	let selectedDate = $state<DateValue>();

	$effect(() => {
		if (selectedDate) {
			value = selectedDate.toDate(getLocalTimeZone());
		}
	});
</script>

<Popover>
	<PopoverTrigger
		class={[
			'flex w-full items-center !justify-start !font-normal',
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
