<script lang="ts">
	import { page } from '$app/state';
	import Cart from '$lib/components/pages/customers/daily-sales/cart.svelte';
	import ProductSearch from '$lib/components/pages/customers/daily-sales/product-search.svelte';
	import Summary from '$lib/components/pages/customers/daily-sales/summary.svelte';
	import SelectCustomer from '$lib/components/pages/customers/select-customer.svelte';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import type { DailySalesItem } from '$lib/types/global';
	import type { PageProps } from './$types';

	let { form } : PageProps = $props();
	let errors = $derived(form?.errors?.properties);

	let cartProducts = $state<DailySalesItem[]>([]);
	let customerId = $state<string | undefined>();
	let selectCustomerProps = $derived.by(() => {
	    let customers = page.data?.customers ?? [];
		return customers.map((c: typeof customers[0]) => ({ value: c.id, label: c.name }));
	});
</script>

<svelte:head>
	<title>RamTech | Daily Sales</title>
	<meta name="description" content="Manage daily sales" />
</svelte:head>

<section class="space-y-2">
    <Card class="py-3">
        <CardContent >
            <div class="space-y-2">
                <Label>Customer</Label>
                <SelectCustomer bind:value={customerId} bind:customers={selectCustomerProps} className={errors?.customer_id ? 'border-red-500' : ''} />

                {#if errors?.customer_id}
                    <small class="text-red-500 block">{errors?.customer_id.errors[0]}</small>
                {/if}
            </div>
        </CardContent>
    </Card>
    <div class="flex gap-1">
    	<ProductSearch bind:items={cartProducts} />
    	<Cart bind:items={cartProducts} />
    	<Summary bind:items={cartProducts} bind:customerId />
    </div>
</section>
