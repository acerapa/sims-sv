<script lang="ts">
	import JsBarcode from 'jsbarcode';

	let { value }: { value: string } = $props();

	let svgElement = $state<SVGSVGElement>();

	$effect(() => {
		if (svgElement && value) {
			JsBarcode(svgElement, value, {
				format: 'CODE128',
				width: 2,
				height: 60,
				displayValue: true,
				fontSize: 14,
				margin: 10
			});
		}
	});
</script>

<svg bind:this={svgElement}></svg>
