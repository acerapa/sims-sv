import type { Actions, PageServerLoad } from './$types';
import { pageContext } from '$lib/stores/pageContext';
import z from 'zod';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { suppliers } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ depends }) => {
	depends('vendor:suppliers');

	pageContext.set({
		pageTitle: {
			title: 'Suppliers',
			subTitle: 'Manage Suppliers'
		}
	});

	return {
		suppliers: await db
			.select({
				id: suppliers.id,
				name: suppliers.name,
				email: suppliers.email,
				address: suppliers.address,
				phone_number: suppliers.phone_number,
				contact_person: suppliers.contact_person,
				telephone_number: suppliers.telephone_number
			})
			.from(suppliers)
			.orderBy(desc(suppliers.created_at))
			.execute()
	};
};

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

			return await db
				.insert(suppliers)
				.values(Object(data))
				.returning({ lastInsertedId: suppliers.id });
		} catch (error) {
			return fail(500, {
				message: 'Internal Server Error',
				errors: (error as Error).message
			});
		}
	}
};
