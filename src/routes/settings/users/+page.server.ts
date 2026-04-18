import type { Actions, PageServerLoad } from './$types';
import * as z from 'zod';
import type { User } from '$lib/types/global';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { hash } from 'bcrypt';
import { getUsers } from '$lib/server/db/queries/users';

export const load: PageServerLoad = async ({ depends }) => {
	depends('settings:users');

	return {
		users: await getUsers()
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		try {
			const data = Object.fromEntries(await request.formData()) as Partial<User>;
			data.is_active = data.is_active?.toString().toLocaleLowerCase() === 'true' ? true : false;

			const baseFields = {
				name: z.string('Must be a string').min(1, 'Name is required'),
				is_active: z.boolean().default(true).optional()
			};

			const userFormSchema = z.discriminatedUnion('role', [
				z.object({
					...baseFields,
					email: z.email('Invalid email'),
					password: z
						.string('Must be a string')
						.min(8, 'Password must be at least 8 characters long'),
					role: z.enum(['admin', 'cashier', 'inventory-manager'], 'Must be a valid role')
				}),
				z.object({
					...baseFields,
					email: z
						.union([z.email('Invalid email'), z.literal('')])
						.nullable()
						.optional(),
					password: z
						.union([
							z.string('Must be a string').min(8, 'Password must be at least 8 characters long'),
							z.literal('')
						])
						.nullable()
						.optional(),
					role: z.literal('sales-person')
				})
			]);

			const { success, error } = userFormSchema.safeParse(data);

			if (!success) {
				return fail(400, {
					errors: z.treeifyError(error),
					message: 'Invalid input'
				});
			}

			if (data.role && data.role !== 'sales-person') {
				const saltRound = 10;
				const password = data.password || '';
				const hashedPassword = await hash(password, saltRound);

				data.password = hashedPassword;
			} else {
				if (!data.email) data.email = null;
				if (!data.password) data.password = null;
			}

			return await db.insert(users).values(Object(data)).returning({ lastInsertedId: users.id });
		} catch (error) {
			console.error(error);
			return fail(500, {
				message: 'Internal Server Error',
				errors: (error as Error).message
			});
		}
	}
};
