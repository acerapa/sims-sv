<script lang="ts">
	import { Minus, Plus } from '@lucide/svelte';
	import { Button } from '../ui/button';
	import { ButtonGroup } from '../ui/button-group';
	import { Input } from '../ui/input';

	let {
		value = $bindable<number>(0),
		onDecrease = $bindable<() => void>(),
		onIncrease = $bindable<() => void>(),
		min = $bindable<number | null>(null),
		max = $bindable<number | null>(null)
	} = $props();

	const onDecreaseValue = () => {
		if (onDecrease) {
			onDecrease();
		} else {
			value--;
		}
	};

	const onIncreaseValue = () => {
		if (onIncrease) {
			onIncrease();
		} else {
			value++;
		}
	};
</script>

<ButtonGroup>
	<Button onclick={() => onDecreaseValue()} variant="outline" size="icon-sm">
		<Minus />
	</Button>
	<Input
		type="number"
		{value}
		class="field-sizing-content h-auto w-fit [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
	/>
	<Button variant="outline" size="icon-sm" onclick={() => onIncreaseValue()}>
		<Plus />
	</Button>
</ButtonGroup>
