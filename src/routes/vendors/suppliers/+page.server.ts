import type { Actions } from './$types';
import z from 'zod';
import { fail } from '@sveltejs/kit';
import { createSupplier, type CreateSupplierData } from '$lib/server/db/queries/suppliers';
import { DrizzleQueryError } from 'drizzle-orm';
import { type PostgresError } from 'postgres';

export const actions: Actions = {
	default: async ({ request }) => {
		try {
			const body = await request.formData();
			const data: Record<string, string | null> = {};

			body.forEach((value, key) => {
				data[key] = value.toString();
			});

			if (data.email === '') {
				delete data.email;
			}

			const supplierSchema = z.object({
				name: z.string().min(1, 'Name is required'),
				contact_person: z.string().min(1, 'Contact person is required'),
				address: z.string().min(1, 'Address is required'),
				email: z.email().optional(),
				phone_number: z.string().optional(),
				telephone_number: z.string().optional(),
				notes: z.string().optional()
			});

			const { success, error } = supplierSchema.safeParse(data);

			if (!success) {
				return fail(400, {
					errors: z.treeifyError(error),
					message: 'Invalid input'
				});
			}

			return await createSupplier(Object(data) as CreateSupplierData);
		} catch (error) {
			if (error instanceof DrizzleQueryError && error.cause) {
				const cause = error.cause as PostgresError;
				if (cause?.code === '23505') {
					return fail(409, {
						message: 'Supplier already exists',
						errors: {
							properties: {
								name: {
									errors: ['Supplier name already exists']
								}
							}
						}
					});
				}
			}
			return fail(500, {
				message: 'Internal Server Error',
				errors: (error as Error).message
			});
		}
	}
};
