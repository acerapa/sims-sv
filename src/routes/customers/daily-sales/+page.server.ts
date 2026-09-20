import { getProducts } from '$lib/server/db/queries/products';
import { SvelteURLSearchParams } from 'svelte/reactivity';
import type { PageServerLoad } from './$types';
import { decode } from 'decode-formdata';
import { getWalkInCustomer } from '$lib/server/db/queries/customers';
import z from 'zod';
import { fail } from '@sveltejs/kit';
import type { CreateSalesOrder } from '$lib/server/db/queries/sales-orders';
import { createDailySales } from '$lib/server/db/queries/daily-sales';

export const load: PageServerLoad = async ({ url }) => {
	const search = new SvelteURLSearchParams(url.searchParams);
	const query = search.get('search') ?? '';
	const [walkInCustomer] = await getWalkInCustomer();

	let products;
	if (query) {
		products = await getProducts(query);
	}

	return { products: products ?? [], walkInCustomerId: walkInCustomer?.id ?? null };
};

export const actions = {
  createDailySales: async ({ request }) => {
    try {
      const body = await request.formData();
      const formValues = decode(body, {
        arrays: ['products'],
        numbers: [
          'customer_id',
          'total_cost',
          'staff_user_id',
          'products.$.quantity',
          'products.$.total_price',
          'products.$.unit_price',
          'products.$.product_id',
          'products.$.package_id'
        ],
        dates: ['date_ordered']
      }) as CreateSalesOrder;

      const salesOrderSchema = z
        .object({
          customer_id: z.number('Customer is required'),
          staff_user_id: z.number('Staff user is required'),
          date_ordered: z.date('Order date is required'),
          order_type: z.enum(['onetime', 'installment'], 'Must be either "onetime" or "installment"'),
          notes: z.string().optional(),
          products: z
            .array(
              z.object({
                product_id: z.number().nullable().optional(),
                package_id: z.number().nullable().optional(),
                quantity: z.number('Quantity is required').min(1, 'Quantity must be at least 1'),
                unit_price: z.number('Unit price is required'),
                total_price: z.number('Total price is required'),
                serial_number: z.string().optional()
              })
            )
            .min(1, 'At least one product is required')
        })
        .superRefine((val, ctx) => {
          (val.products || []).forEach((p: (typeof val.products)[0], idx: number) => {
            if (!p.product_id && !p.package_id) {
              ctx.addIssue({
                code: 'custom',
                message: 'Either product or package is required',
                path: ['products', idx]
              });
            }
          });
        });

      const { success, error } = salesOrderSchema.safeParse(formValues);
      if (!success) {
        console.log(error, formValues);
        return fail(400, {
          message: 'Invalid data!',
          errors: z.treeifyError(error),
          issues: error.issues
        });
      }


      return await createDailySales(formValues);
    } catch (e) {
      return fail(500, {
        message: 'Internal server error',
        error: e
      });
    }
	}
};
