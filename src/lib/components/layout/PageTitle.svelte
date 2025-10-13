<script lang="ts">
	let { title, subTitle } = $props();
</script>

<div>
	<h1 class="mb-2 text-3xl font-bold text-foreground">{title}</h1>
	<span class="mb-6 text-muted-foreground">{subTitle}</span>
</div>
