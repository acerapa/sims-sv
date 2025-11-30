import { getPOBySupplierId } from '$lib/server/db/queries/po';
import { decode } from 'decode-formdata';
import type { Actions, PageServerLoad } from './$types';
import z from 'zod';
import { fail } from '@sveltejs/kit';
import {
	createBill,
	updateBill,
	getBill,
	getBills,
	type CreateBillData,
	type UpdateBillData
} from '$lib/server/db/queries/bills';

export const load: PageServerLoad = async ({ url, depends }) => {
	depends('vendors:bills');
	const billId = url.searchParams.get('id');
	let bill = null;

	if (billId) {
		bill = await getBill(parseInt(billId));
	}

	const bills = await getBills();
	return {
		bills,
		bill
	};
};

export const actions: Actions = {
	createBill: async ({ request }) => {
		try {
			const formData = await request.formData();
			const formValues = decode(formData, {
				numbers: ['supplier_id', 'purchase_order_id', 'paid_amount', 'total_amount'],
				dates: ['bill_date', 'due_date']
			}) as CreateBillData;

			const billSchema = z
				.object({
					supplier_id: z.number('Supplier is required!').min(1, 'Supplier is required!'),
					purchase_order_id: z
						.number('Purchase order is required!')
						.min(1, 'Purchase order is required!'),
					bill_date: z.date('Bill date is required!'),
					due_date: z.date('Due date is required!'),
					paid_amount: z.number('Paid amount is required!').min(1, 'Paid amount is required!'),
					total_amount: z.number('Total amount is required!').min(1, 'Total amount is required!'),
					notes: z.string().optional(),
					payment_type: z.enum(['cash', 'check'], 'Must be either cash or check'),
					check_number: z.string().optional(),
					bill_status: z.enum(['partial', 'paid'])
				})
				.superRefine((data, ctx) => {
					if (data.payment_type === 'check' && !data.check_number) {
						ctx.addIssue({
							code: 'custom',
							message: 'Check number is required for check payment type',
							path: ['check_number']
						});
					}
				});

			const { success, error } = billSchema.safeParse(formValues);
			if (!success) {
				return fail(400, {
					message: 'Invalid input',
					error: z.treeifyError(error)
				});
			}

			return await createBill(formValues);
		} catch (error) {
			console.error(error);
			return fail(500, { error: 'Failed to create bill' });
		}
	},
	getSupplierRelatedPO: async ({ request }) => {
		const formData = await request.formData();
		const supplierId = formData.get('supplier_id') as string;

		return await getPOBySupplierId(parseInt(supplierId));
	},

	updateBill: async ({ request }) => {
		try {
			const formData = await request.formData();
			const formValues = decode(formData, {
				numbers: ['id', 'supplier_id', 'purchase_order_id', 'paid_amount', 'total_amount'],
				dates: ['bill_date', 'due_date']
			}) as UpdateBillData;

			const billSchema = z
				.object({
					id: z.number('Bill ID is required!').min(1, 'Bill ID is required!'),
					supplier_id: z.number('Supplier is required!').min(1, 'Supplier is required!'),
					purchase_order_id: z
						.number('Purchase order is required!')
						.min(1, 'Purchase order is required!'),
					bill_date: z.date('Bill date is required!'),
					due_date: z.date('Due date is required!'),
					paid_amount: z.number('Paid amount is required!').min(1, 'Paid amount is required!'),
					total_amount: z.number('Total amount is required!').min(1, 'Total amount is required!'),
					notes: z.string().optional(),
					payment_type: z.enum(['cash', 'check'], 'Must be either cash or check'),
					check_number: z.string().optional(),
					bill_status: z.enum(['partial', 'paid'])
				})
				.superRefine((data, ctx) => {
					if (data.payment_type === 'check' && !data.check_number) {
						ctx.addIssue({
							code: 'custom',
							message: 'Check number is required for check payment type',
							path: ['check_number']
						});
					}
				});

			const { success, error } = billSchema.safeParse(formValues);
			if (!success) {
				return fail(400, {
					message: 'Invalid input',
					error: z.treeifyError(error)
				});
			}

			return await updateBill(formValues);
		} catch (error) {
			console.error(error);
			return fail(500, { error: 'Failed to update bill' });
		}
	}
};
