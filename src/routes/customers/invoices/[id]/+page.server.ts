import { createPayment, getInvoice, type CreatePaymentData } from '$lib/server/db/queries/invoices';
import { fail, redirect } from '@sveltejs/kit';
import { decode } from 'decode-formdata';
import z from 'zod';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const invoiceId = parseInt(params.id);
	const invoice = await getInvoice(invoiceId);
	return { invoice };
};

export const actions: Actions = {
	receivePayment: async ({ request }) => {
		try {
			const body = await request.formData();
			const formValues = decode(body, {
				numbers: ['invoice_id', 'amount'],
				dates: ['payment_date']
			}) as CreatePaymentData;

			const paymentSchema = z
				.object({
					invoice_id: z.number('Invoice is required'),
					payment_date: z.date('Payment date is required'),
					amount: z.number('Amount is required').min(0.01, 'Amount must be greater than 0'),
					payment_type: z.enum(
						['cash', 'check', 'bank_transfer'],
						'Must be cash, check, or bank transfer'
					),
					check_number: z.string().optional(),
					reference_number: z.string().optional(),
					notes: z.string().optional()
				})
				.superRefine((data, ctx) => {
					if (data.payment_type === 'check' && !data.check_number) {
						ctx.addIssue({
							code: 'custom',
							message: 'Check number is required for check payments',
							path: ['check_number']
						});
					}
				});

			const { success, error } = paymentSchema.safeParse(formValues);

			if (!success) {
				return fail(400, {
					message: 'Invalid data!',
					errors: z.treeifyError(error),
					issues: error.issues
				});
			}

			return await createPayment(formValues);
		} catch (error) {
			return fail(500, {
				message: 'An error occurred while processing the payment',
				error: (error as Error).message
			});
		}
	}
};
